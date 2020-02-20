mod hasura;

use futures;
use hyper;
use hyper::service::make_service_fn;
use hyper::service::service_fn;
use hyper::Body;
use hyper::Method;
use hyper::Response;
use hyper::Server;
use hyper::StatusCode;
use juniper::FieldResult;
use juniper::RootNode;
use log::info;
use std::sync::Arc;

async fn clone_repo(repo_id: &str) /*-> std::path::PathBuf*/ {}

async fn get_blame(repo_id: &str, file_path: &str, commit: &str) {
  // Check if this stuff exists in hasura blamelines table. If so, return that.
  match hasura::get_blame_lines(repo_id, file_path, commit).await? {
    Some(blamelines) => blamelines,
    None => {}
  }

  // Check if repo_id is cloned in the filesystem. If not then do a clone.

  // Check if we have commit locally. If not do a git remote update.
  // run git blame
  // Calculate blameline info.
  // Insert blamelines into hasura in one transaction.
}

struct Query;

#[juniper::graphql_object]
impl Query {
  async fn GitHubFileThreads(
    github_repo_id: String,
    file_path: String,
    last_file_commit: String,
  ) -> FieldResult<i32> {
    // Check that the user is allowed read access to the repo.
    // Lookup our repo_id for the github_repo_id.
    // Get blame info
    // Look up comments by repo, file_path
    Ok(123)
  }
}

struct Mutation;

#[juniper::graphql_object]
impl Mutation {
  async fn startGitHubThread(
    github_repo_id: String,
    file_path: String,
    last_file_commit: String,
    comment_content: String,
  ) -> FieldResult<i32> {
    // TODO: Check that the user is allowed read access to the repo. For now all
    // repos must be public.

    // Lookup our repo_id for the github_repo_id
    let repo_id = hasura::github_repo_id_to_repo_id(&github_repo_id).await?;

    // Get blame info for the repo_id at last_file_commit
    let blame = get_blame(&repo_id, &file_path, &last_file_commit).await;

    // Insert new thread in hasura

    Ok(19821891)
  }
}

#[tokio::main]
async fn main() {
  env_logger::init();

  let root_node = Arc::new(RootNode::new(Query, Mutation));

  let make_service = make_service_fn(|_| {
    let root_node = root_node.clone();
    async {
      Ok::<_, hyper::Error>(service_fn(move |req| {
        let root_node = root_node.clone();
        async {
          let start_time = std::time::Instant::now();
          let method = req.method().clone();
          let uri = req.uri().path().to_owned();
          info!("--> {} {}", method, uri);

          (match (&method, uri.as_ref()) {
            (&Method::GET, "/") => juniper_hyper::graphiql("/graphql").await,
            (&Method::GET, "/graphql") | (&Method::POST, "/graphql") => {
              juniper_hyper::graphql_async(root_node, Arc::new(()), req).await
            }
            _ => {
              let mut response = Response::new(Body::empty());
              *response.status_mut() = StatusCode::NOT_FOUND;
              Ok::<_, hyper::Error>(response)
            }
          })
          .and_then(|resp| {
            info!(
              "<-- {} {} {} {}ms",
              method,
              uri,
              resp.status().as_u16(),
              start_time.elapsed().as_millis()
            );
            Ok(resp)
          })
        }
      }))
    }
  });

  let addr = ([127, 0, 0, 1], 3000).into();
  let server = Server::bind(&addr).serve(make_service);
  println!("Listening on http://{}", addr);

  if let Err(e) = server.await {
    eprintln!("server error: {}", e)
  }
}
