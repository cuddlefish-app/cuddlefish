// Calling GitHub API endpoints.
use anyhow::anyhow;
use graphql_client::GraphQLQuery;

use crate::GitHubAuth;

static USER_AGENT: &str = concat!(env!("CARGO_PKG_NAME"), "/", env!("CARGO_PKG_VERSION"));

// type URI = String;
type GitObjectID = String;

// The GitHub API has two notions of id: a node id, and databaseId. Node ids are the "new" solutions and are
// base64-encoded id's that are globally unique. DatabaseIds are the "old" solutions and are numeric.
#[derive(Debug)]
pub struct GitHubNodeId(pub String);

async fn github_request<B: serde::ser::Serialize + ?Sized, T: serde::de::DeserializeOwned>(
  auth: Option<&GitHubAuth>,
  json_body: &B,
) -> anyhow::Result<T> {
  // The GitHub API requires User-Agent to be set on every request
  // (https://developer.github.com/v3/#user-agent-required).
  let response = reqwest::Client::builder()
    .user_agent(USER_AGENT)
    .build()?
    .post("https://api.github.com/graphql")
    .bearer_auth(
      auth
        .map(|x| &x.access_token)
        .unwrap_or(&*crate::GITHUB_API_TOKEN),
    )
    .json(&json_body)
    .send()
    .await?;

  let response_parsed: graphql_client::Response<T> = response.json().await?;

  // The order of these branches is significant.
  match (response_parsed.data, response_parsed.errors) {
    (_, Some(errs)) => Err(anyhow!("GraphQL response includes errors: {:?}", errs)),
    (Some(x), _) => Ok(x),
    _ => Err(anyhow!(
      "expected either `data` or `response` fields to be present",
    )),
  }
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "gql/github/schema.json",
  query_path = "gql/github/queries.graphql",
  response_derives = "Debug"
)]
pub struct LookupCommit;

/// Returns Some((repo_node_id, isPrivate, commit_in_repo)) if we are able to find the repo, and None if we were not
/// able to find the repo.
pub async fn lookup_commit(
  auth: Option<&GitHubAuth>,
  repo_owner: &str,
  repo_name: &str,
  commit_oid: &str,
) -> anyhow::Result<Option<(GitHubNodeId, bool, bool)>> {
  let res: lookup_commit::ResponseData = github_request(
    auth,
    &LookupCommit::build_query(lookup_commit::Variables {
      repo_owner: repo_owner.to_string(),
      repo_name: repo_name.to_string(),
      commit_oid: commit_oid.to_string(),
    }),
  )
  .await?;

  // `res.repository == None` when the repo can't be found.
  Ok(res.repository.map(|repo| {
    (
      GitHubNodeId(repo.id),
      repo.is_private,
      repo.object.is_some(),
    )
  }))
}
