// Calling GitHub API endpoints.
// use crate::CFResult;
// use failure::bail;
// use failure::err_msg;
// use failure::ResultExt;
// use graphql_client::GraphQLQuery;

// static USER_AGENT: &str = concat!(env!("CARGO_PKG_NAME"), "/", env!("CARGO_PKG_VERSION"));

// type URI = String;

// async fn github_request<B: serde::ser::Serialize + ?Sized, T: serde::de::DeserializeOwned>(
//   json_body: &B,
// ) -> CFResult<T> {
//   // TODO: don't hardcode URL, header.
//   // TODO: use the user's token here. Note that in cases where the user is not logged in we'd still like to be able to
//   // show the comments, so we may need to still have a fallback token.

//   // The GitHub API requires User-Agent to be set on every request
//   // (https://developer.github.com/v3/#user-agent-required).
//   let response = reqwest::Client::builder()
//     .user_agent(USER_AGENT)
//     .build()?
//     .post("https://api.github.com/graphql")
//     .bearer_auth(std::env::var("GITHUB_API_TOKEN").expect("GITHUB_API_TOKEN env var not specified"))
//     .json(&json_body)
//     .send()
//     .await?;

//   let response_parsed: graphql_client::Response<T> = response
//     .json()
//     .await
//     .context("Parsing GraphQL response as JSON")?;

//   // The order of these branches is significant.
//   match (response_parsed.data, response_parsed.errors) {
//     (_, Some(errs)) => bail!("GraphQL response includes errors: {:?}", errs),
//     (Some(x), _) => Ok(x),
//     _ => bail!("expected either `data` or `response` fields to be present",),
//   }
// }

// #[derive(graphql_client::GraphQLQuery)]
// #[graphql(
//   schema_path = "gql/github/schema.json",
//   query_path = "gql/github/queries.graphql",
//   response_derives = "Debug"
// )]
// pub struct RepoUrl;

// pub async fn repo_url(node_id: &str) -> CFResult<Option<String>> {
//   let res: repo_url::ResponseData = github_request(&RepoUrl::build_query(repo_url::Variables {
//     id: node_id.into(),
//   }))
//   .await?;

//   match res.node {
//     None => Ok(None),
//     Some(node) => match node.on {
//       repo_url::RepoUrlNodeOn::Repository(repo) => Ok(Some(repo.url)),
//       _ => Err(err_msg("Response node should have been a Repository")),
//     },
//   }
// }
