use crate::BlameLine;
use crate::CFResult;
use crate::GitHubUserId;
use crate::HASURA_HOST;
use crate::HASURA_PORT;
use failure::bail;
use graphql_client::GraphQLQuery;
use serde_json::json;
use std::convert::TryFrom;
use std::convert::TryInto;

// This name comes from GraphQL/Hasura, so it's not camel case.
#[allow(non_camel_case_types)]
type uuid = String;

#[allow(non_snake_case)]
async fn ADMIN_hasura_request<B: serde::ser::Serialize + ?Sized, T: serde::de::DeserializeOwned>(
  json_body: &B,
) -> CFResult<T> {
  let hasura_url = format!("http://{}:{}/v1/graphql", *HASURA_HOST, *HASURA_PORT);
  let response = reqwest::Client::new()
    .post(&hasura_url)
    .header(
      "x-hasura-admin-secret",
      &*crate::HASURA_GRAPHQL_ADMIN_SECRET,
    )
    .json(&json_body)
    .send()
    .await?;
  let response_parsed: graphql_client::Response<T> = response.json().await?;

  // The order of these branches is significant.
  match (response_parsed.data, response_parsed.errors) {
    (_, Some(errs)) => bail!("GraphQL response includes errors: {:?}", errs),
    (Some(x), _) => Ok(x),
    _ => bail!("expected either `data` or `response` fields to be present"),
  }
}

// See https://github.com/rust-lang/rust/issues/75798 and https://github.com/graphql-rust/graphql-client/issues/302 as
// to why we can't have nice things. We definitely want these to happen in a single transaction which means we need to
// write the GraphQL ourselves.
pub async fn insert_blamelines(
  commit: &str,
  file_path: &str,
  blamelines: Vec<BlameLine>,
) -> CFResult<()> {
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

pub async fn lookup_existing_blamelines(commit: &str, file_path: &str) -> CFResult<bool> {
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

// GitHub user ID's (and perhaps ID's for other things!) are semantically u64
// (or just natural numbers), but there's only an Int GraphQL type, and
// graphql_client maps this to i64.
fn cast_user_github_id(user_github_id: GitHubUserId) -> i64 {
  i64::try_from(user_github_id).expect("this shouldn't be a problem until GitHub has 9e18 users!")
}

// TODO should also store GH access tokens
pub async fn upsert_user(
  github_id: GitHubUserId,
  github_name: &str,
  github_node_id: &str,
  github_username: &str,
  github_email: Option<String>,
) -> CFResult<()> {
  let res: upsert_user::ResponseData =
    ADMIN_hasura_request(&UpsertUser::build_query(upsert_user::Variables {
      github_id: cast_user_github_id(github_id),
      github_name: github_name.into(),
      github_node_id: github_node_id.into(),
      github_username: github_username.into(),
      github_email: github_email.into(),
    }))
    .await?;

  // TODO: This is just a poor man's assert. Can it be made cleaner?
  match res.insert_users_one {
    None => bail!("this should never happen as long as hasura is sane"),
    Some(_) => Ok(()),
  }
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "gql/hasura/schema.json",
  query_path = "gql/hasura/queries.graphql",
  response_derives = "Debug"
)]
struct StartUserSession;

pub async fn start_user_session(user_github_id: GitHubUserId) -> CFResult<String> {
  let res: start_user_session::ResponseData = ADMIN_hasura_request(&StartUserSession::build_query(
    start_user_session::Variables {
      user_github_id: cast_user_github_id(user_github_id),
    },
  ))
  .await?;

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

pub async fn lookup_user_session(session_token: &str) -> CFResult<Option<GitHubUserId>> {
  let res: lookup_session::ResponseData =
    ADMIN_hasura_request(&LookupSession::build_query(lookup_session::Variables {
      session_token: session_token.to_owned(),
    }))
    .await?;

  match res.user_sessions_by_pk {
    None => Ok(None),
    Some(x) => Ok(Some(
      x.user
        .github_id
        .try_into()
        .expect("github user id doesn't fit into u64"),
    )),
  }
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "gql/hasura/schema.json",
  query_path = "gql/hasura/queries.graphql",
  response_derives = "Debug"
)]
struct EndUserSession;

pub async fn end_user_session(session_token: &str) -> CFResult<()> {
  // The success of response.json() depends on the correct type being inferred
  // for the output, so we must be explicit in requesting `end_user_session::ResponseData`.
  let _: end_user_session::ResponseData =
    ADMIN_hasura_request(&EndUserSession::build_query(end_user_session::Variables {
      session_token: session_token.to_owned(),
    }))
    .await?;
  Ok(())
}
