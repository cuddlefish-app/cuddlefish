/// Calling Hasura endpoints.
use crate::BlameLine;
use crate::CFResult;
use failure::bail;
use serde_json::json;

// This name comes from GraphQL/Hasura, so it's not camel case.
// #[allow(non_camel_case_types)]
// type uuid = String;

#[allow(non_snake_case)]
async fn ADMIN_hasura_request<B: serde::ser::Serialize + ?Sized, T: serde::de::DeserializeOwned>(
  json_body: &B,
) -> CFResult<T> {
  // TODO: don't hardcode URL, header.
  let response = reqwest::Client::new()
    .post("https://cuddlefish-hasura.herokuapp.com/v1/graphql")
    .header("x-hasura-admin-secret", &*crate::HASURA_ADMIN_SECRET)
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

// See https://github.com/rust-lang/rust/issues/75798 as to why we can't have nice things. We definitely want these to
// happen in a single transaction which means we need to write the GraphQL ourselves.
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

// #[derive(graphql_client::GraphQLQuery)]
// #[graphql(
//   schema_path = "gql/hasura/schema.json",
//   query_path = "gql/hasura/queries.graphql",
//   response_derives = "Debug"
// )]
// pub struct GetRepoIdByGitHubNodeId;

// /// Conversion from a GitHub node id for a repository to a hasura repo_id.
// /// Upserts into the repositories table if this repo isn't tracked yet.
// pub async fn github_node_id_to_repo_id(github_node_id: &str) -> CFResult<RepoId> {
//   // TODO: should query hasura, on failure check github to see that it's a legit
//   // node id and then insert into hasura and return.
//   let res: get_repo_id_by_git_hub_node_id::ResponseData = hasura_request(
//     &GetRepoIdByGitHubNodeId::build_query(get_repo_id_by_git_hub_node_id::Variables {
//       github_node_id: github_node_id.into(),
//     }),
//   )
//   .await?;
//   let repos = res
//     .insert_repositories
//     .ok_or_else(|| {
//       format_err!(
//         "expected `insert_repositories` on GetRepoIdByGitHubNodeId response with node id {}",
//         github_node_id
//       )
//     })?
//     .returning;
//   match &repos[..] {
//     [repo] => Ok(RepoId(repo.id.to_string())),
//     _ => bail!("expected exactly one repository in GetRepoIdByGitHubNodeId response"),
//   }
// }

// #[derive(graphql_client::GraphQLQuery)]
// #[graphql(
//   schema_path = "gql/hasura/schema.json",
//   query_path = "gql/hasura/queries.graphql",
//   response_derives = "Debug"
// )]
// pub struct LookupRepoById;

// /// Lookup the GitHub node id for a RepoId. Can be None if repo_id is not found.
// pub async fn repo_id_to_github_node_id(repo_id: &RepoId) -> CFResult<Option<String>> {
//   let res: lookup_repo_by_id::ResponseData =
//     hasura_request(&LookupRepoById::build_query(lookup_repo_by_id::Variables {
//       repo_id: repo_id.0.to_string(),
//     }))
//     .await?;
//   Ok(res.repositories_by_pk.map(|x| x.github_node_id))
// }

// #[derive(graphql_client::GraphQLQuery)]
// #[graphql(
//   schema_path = "gql/hasura/schema.json",
//   query_path = "gql/hasura/queries.graphql",
//   response_derives = "Debug"
// )]
// pub struct FileBlameLines;

// pub async fn get_blame_lines(
//   repo_id: &RepoId,
//   file_path: &str,
//   commit: &str,
// ) -> CFResult<Option<Vec<BlameLine>>> {
//   let res: file_blame_lines::ResponseData =
//     hasura_request(&FileBlameLines::build_query(file_blame_lines::Variables {
//       repo_id: repo_id.0.to_string(),
//       file_path: file_path.into(),
//       commit: commit.into(),
//     }))
//     .await?;

//   let mut hasura_blamelines = res.blamelines;
//   hasura_blamelines.sort_by(|a, b| a.current_line_number.cmp(&b.current_line_number));

//   // Defensively check that all current_line_numbers exist.
//   ensure!(
//     hasura_blamelines
//       .iter()
//       .enumerate()
//       .all(|(i, x)| i + 1 == x.current_line_number as usize),
//     "Hasura blamelines table is missing lines!"
//   );

//   let blamelines: Vec<BlameLine> = hasura_blamelines
//     .iter()
//     .map(|x| BlameLine {
//       original_commit: x.original_commit.to_string(),
//       original_file_path: x.original_file_path.to_string(),
//       // This cast should always be fine.
//       original_line_number: x.original_line_number as i32,
//     })
//     .collect();

//   if blamelines.is_empty() {
//     Ok(None)
//   } else {
//     Ok(Some(blamelines))
//   }
// }
