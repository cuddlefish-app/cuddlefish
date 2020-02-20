use graphql_client::GraphQLQuery;
use std::fmt::Debug;

// This name comes from GraphQL/Hasura, so it's not camel case.
#[allow(non_camel_case_types)]
type uuid = String;

type HasuraResult<T> = Result<T, Box<dyn std::error::Error>>;

#[derive(Debug)]
struct HasuraGQLErrors<E: Debug>(Vec<E>);
impl<E: Debug> std::error::Error for HasuraGQLErrors<E> {}
impl<E: Debug> std::fmt::Display for HasuraGQLErrors<E> {
  fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
    write!(f, "Hasura returned an error response: {:?}", self.0)
  }
}

#[derive(Debug)]
struct BadHasuraResponse(String);
impl std::error::Error for BadHasuraResponse {}
impl std::fmt::Display for BadHasuraResponse {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "Received a payload from Hasura that's weird: {}", self.0)
  }
}

async fn hasura_request<B: serde::ser::Serialize + ?Sized, T: serde::de::DeserializeOwned>(
  raw_access_token: &str,
  json_body: &B,
) -> HasuraResult<T> {
  let response = reqwest::Client::new()
    .post("https://cuddlefish-hasura.herokuapp.com/v1/graphql")
    .header("Authorization", format!("Bearer {}", raw_access_token))
    .json(&json_body)
    .send()
    .await?;
  let response_parsed: graphql_client::Response<T> = response.json().await?;

  // The order of these branches is significant.
  match (response_parsed.data, response_parsed.errors) {
    (_, Some(errs)) => Err(Box::new(HasuraGQLErrors(errs))),
    (Some(x), _) => Ok(x),
    _ => Err(Box::new(BadHasuraResponse(
      "expected either `data` or `response` fields to be present".to_string(),
    ))),
  }
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "hasura_gql/schema.json",
  query_path = "hasura_gql/queries.graphql",
  response_derives = "Debug"
)]
pub struct GetRepoIdByGitHubRepoId;

pub async fn github_repo_id_to_repo_id(github_repo_id: &str) -> HasuraResult<String> {
  let res: get_repo_id_by_git_hub_repo_id::ResponseData = hasura_request(
    "",
    &GetRepoIdByGitHubRepoId::build_query(get_repo_id_by_git_hub_repo_id::Variables {
      github_repo_id: github_repo_id.into(),
    }),
  )
  .await?;
  let repos = res
    .insert_repositories
    .ok_or_else(|| {
      Box::new(BadHasuraResponse(
        "expected `insert_repositories`".to_string(),
      ))
    })?
    .returning;
  match &repos[..] {
    [repo] => Ok(repo.id.to_string()),
    _ => Err(Box::new(BadHasuraResponse(
      "expected exactly one repository".to_string(),
    ))),
  }
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "hasura_gql/schema.json",
  query_path = "hasura_gql/queries.graphql",
  response_derives = "Debug"
)]
pub struct FileBlameLines;

pub struct BlameLine {
  original_commit: String,
  original_file_path: String,
  original_line_number: u32,
}

pub async fn get_blame_lines(
  repo_id: &str,
  file_path: &str,
  commit: &str,
) -> HasuraResult<Option<Vec<BlameLine>>> {
  let res: file_blame_lines::ResponseData = hasura_request(
    " ",
    &FileBlameLines::build_query(file_blame_lines::Variables {
      repo_id: repo_id.into(),
      file_path: file_path.into(),
      commit: commit.into(),
    }),
  )
  .await?;

  let mut hasura_blamelines = res.blamelines;
  hasura_blamelines.sort_by(|a, b| a.current_line_number.cmp(&b.current_line_number));

  let blamelines: Vec<BlameLine> = hasura_blamelines
    .iter()
    .map(|x| BlameLine {
      original_commit: x.original_commit.to_string(),
      original_file_path: x.original_file_path.to_string(),
      // This cast should always be fine.
      original_line_number: x.original_line_number as u32,
    })
    .collect();

  if blamelines.is_empty() {
    Ok(None)
  } else {
    Ok(Some(blamelines))
  }
}
