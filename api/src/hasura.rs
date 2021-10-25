use crate::github::GitHubNodeId;
use crate::BlameLine;
use crate::GitHubAuth;
use crate::GitHubUserId;
use crate::HASURA_HOST;
use crate::HASURA_PORT;
use anyhow::anyhow;
use anyhow::bail;
use anyhow::ensure;
use anyhow::Context;
use graphql_client::GraphQLQuery;
use serde_json::json;

// This name comes from GraphQL/Hasura, so it's not camel case.
#[allow(non_camel_case_types)]
type uuid = String;

#[allow(non_snake_case)]
async fn ADMIN_hasura_request<B: serde::ser::Serialize + ?Sized, T: serde::de::DeserializeOwned>(
  json_body: &B,
) -> anyhow::Result<T> {
  // TODO should use https here
  let hasura_url = format!("http://{}:{}/v1/graphql", *HASURA_HOST, *HASURA_PORT);
  let response = reqwest::Client::new()
    .post(&hasura_url)
    .header(
      "x-hasura-admin-secret",
      &*crate::HASURA_GRAPHQL_ADMIN_SECRET,
    )
    .json(&json_body)
    .send()
    .await
    .context("sending hasura request")?;

  ensure!(
    response.status().is_success(),
    "hasura returned non-success status {}",
    response.status()
  );

  let response_body = response.text().await?;
  // log::trace!("hasura response: {}", response_body);
  let response_parsed: graphql_client::Response<T> = serde_json::from_str(&response_body)?;

  // Slightly more efficient, harder to debug with:
  // let response_parsed: graphql_client::Response<T> = response
  //   .json()
  //   .await
  //   .context("parsing hasura response as JSON")?;

  // The order of these branches is significant since "errors" take precedence over "data".
  match (response_parsed.data, response_parsed.errors) {
    (_, Some(errs)) => Err(anyhow!("GraphQL response includes errors: {:?}", errs)),
    (Some(x), _) => Ok(x),
    _ => Err(anyhow!(
      "expected either `data` or `response` fields to be present"
    )),
  }
}

// See https://github.com/rust-lang/rust/issues/75798 and https://github.com/graphql-rust/graphql-client/issues/302 as
// to why we can't have nice things. We definitely want these to happen in a single transaction which means we need to
// write the GraphQL ourselves.
pub async fn insert_blamelines(
  commit: &str,
  file_path: &str,
  blamelines: Vec<BlameLine>,
) -> anyhow::Result<()> {
  // Having a non-empty update_columns is necessary unfortunately.
  // See https://github.com/hasura/graphql-engine/issues/1911.
  // Also be careful! Line numbers are always 1-indexed.
  let objects = blamelines
    .iter()
    .enumerate()
    .map(|(i, bl)| {
      format!(
        r#"{{
          original_line: {{
            data: {{ commit: "{}", file_path: "{}", line_number: {} }}
            on_conflict: {{ constraint: lines_pkey, update_columns: [commit] }}
          }}
          x_commit: "{}"
          x_file_path: "{}"
          x_line_number: {}
        }}"#,
        bl.original_commit,
        bl.original_file_path,
        bl.original_line_number,
        commit,
        file_path,
        i + 1
      )
    })
    .collect::<Vec<_>>()
    .join("\n");

  let gql = format!(
    r#"mutation {{
      insert_blamelines(
        objects: [
          {}
        ]
        on_conflict: {{ constraint: blamelines_pkey, update_columns: [] }}
      ) {{
        affected_rows
      }}
    }}"#,
    objects
  );

  let _: serde_json::Value = ADMIN_hasura_request(&json!({
    "query": gql,
    "variables":{}
  }))
  .await?;
  Ok(())
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "gql/hasura/schema.json",
  query_path = "gql/hasura/queries.graphql",
  response_derives = "Debug"
)]
struct LookupExistingBlamelines;

pub async fn lookup_existing_blamelines(commit: &str, file_path: &str) -> anyhow::Result<bool> {
  let res: lookup_existing_blamelines::ResponseData = ADMIN_hasura_request(
    &LookupExistingBlamelines::build_query(lookup_existing_blamelines::Variables {
      commit: commit.into(),
      file_path: file_path.into(),
    }),
  )
  .await?;
  Ok(res.blamelines_by_pk.is_some())
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "gql/hasura/schema.json",
  query_path = "gql/hasura/queries.graphql",
  response_derives = "Debug"
)]
struct UpsertUser;

pub async fn upsert_user(
  github_node_id: &GitHubUserId,
  github_database_id: u32,
  github_name: &str,
  github_username: &str,
  email: Option<String>,
  github_access_token: &str,
) -> anyhow::Result<()> {
  let res: upsert_user::ResponseData =
    ADMIN_hasura_request(&UpsertUser::build_query(upsert_user::Variables {
      github_node_id: github_node_id.0 .0.to_string(),
      github_database_id: github_database_id.into(),
      github_name: github_name.to_string(),
      github_username: github_username.to_string(),
      email: email.into(),
      access_token: github_access_token.to_string(),
    }))
    .await
    .context("upserting user info into hasura")?;

  ensure!(res.insert_github_users_one.is_some());
  Ok(())
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "gql/hasura/schema.json",
  query_path = "gql/hasura/queries.graphql",
  response_derives = "Debug"
)]
struct StartUserSession;

pub async fn start_user_session(github_user: &GitHubUserId) -> anyhow::Result<String> {
  let res: start_user_session::ResponseData = ADMIN_hasura_request(&StartUserSession::build_query(
    start_user_session::Variables {
      user_github_node_id: github_user.0 .0.to_string(),
    },
  ))
  .await
  .context("inserting new session into hasura")?;

  // TODO: This is just a poor man's assert. Can it be made cleaner?
  match res.insert_user_sessions_one {
    None => bail!("this should never happen as long as hasura is sane"),
    Some(x) => Ok(x.id),
  }
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "gql/hasura/schema.json",
  query_path = "gql/hasura/queries.graphql",
  response_derives = "Debug"
)]
struct LookupSession;

// For now, all user sessions are initiated through GitHub.
pub async fn lookup_user_session(session_token: &str) -> anyhow::Result<Option<GitHubAuth>> {
  let res: lookup_session::ResponseData =
    ADMIN_hasura_request(&LookupSession::build_query(lookup_session::Variables {
      session_token: session_token.to_owned(),
    }))
    .await
    .context("looking up session in hasura")?;

  Ok(res.user_sessions_by_pk.map(|x| GitHubAuth {
    github_node_id: GitHubUserId(GitHubNodeId(x.github_user.github_node_id)),
    access_token: x.github_user.access_token.to_string(),
  }))
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "gql/hasura/schema.json",
  query_path = "gql/hasura/queries.graphql",
  response_derives = "Debug"
)]
struct EndUserSession;

pub async fn end_user_session(session_token: &str) -> anyhow::Result<()> {
  // The success of response.json() depends on the correct type being inferred
  // for the output, so we must be explicit in requesting `end_user_session::ResponseData`.
  let _: end_user_session::ResponseData =
    ADMIN_hasura_request(&EndUserSession::build_query(end_user_session::Variables {
      session_token: session_token.to_owned(),
    }))
    .await
    .context("deleting session from hasura")?;
  Ok(())
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "gql/hasura/schema.json",
  query_path = "gql/hasura/queries.graphql",
  response_derives = "Debug"
)]
struct UpsertLine;

pub async fn upsert_line(
  commit_hash: &str,
  file_path: &str,
  line_number: u32,
) -> anyhow::Result<()> {
  let _: upsert_line::ResponseData =
    ADMIN_hasura_request(&UpsertLine::build_query(upsert_line::Variables {
      commit_hash: commit_hash.to_string(),
      file_path: file_path.to_string(),
      line_number: line_number.into(),
    }))
    .await
    .context("upserting line into hasura")?;

  Ok(())
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "gql/hasura/schema.json",
  query_path = "gql/hasura/queries.graphql",
  response_derives = "Debug"
)]
struct StartThread;

/// Returns the created thread's ID.
pub async fn start_thread(
  author_github_node_id: &GitHubUserId,
  commit_hash: &str,
  file_path: &str,
  line_number: u32,
  body: &str,
) -> anyhow::Result<String> {
  upsert_line(&commit_hash, &file_path, line_number).await?;

  let res: start_thread::ResponseData =
    ADMIN_hasura_request(&StartThread::build_query(start_thread::Variables {
      author_github_node_id: author_github_node_id.0 .0.to_string(),
      commit_hash: commit_hash.to_string(),
      file_path: file_path.to_string(),
      line_number: line_number.into(),
      body: body.to_string(),
    }))
    .await
    .context("inserting thread into hasura")?;

  let thread = res
    .insert_threads_one
    .ok_or_else(|| anyhow!("insert_threads_one didn't return a thread"))?;
  ensure!(
    thread.comments.len() == 1,
    "new thread should have exactly one comment"
  );

  Ok(thread.id)
}
