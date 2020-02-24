#![feature(async_closure)]

mod github;
mod hasura;
use failure::ensure;
use failure::format_err;
use failure::Error;
use futures;
use git2::Repository;
use hyper;
use hyper::service::make_service_fn;
use hyper::service::service_fn;
use hyper::Body;
use hyper::Method;
use hyper::Response;
use hyper::Server;
use hyper::StatusCode;
use juniper::FieldResult;
use juniper::GraphQLObject;
use juniper::RootNode;
use log::error;
use log::info;
use log::trace;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;

type CFResult<T> = Result<T, Error>;

/// A UUID corresponding to the Hasura id of a repository.
pub struct RepoId(String);

#[derive(Debug, GraphQLObject)]
pub struct BlameLine {
  original_commit: String,
  original_file_path: String,
  // i32 is the only primitive integer type supported by juniper.
  original_line_number: i32,
}

fn mirror_dir(repo_id: &RepoId) -> PathBuf {
  // repo_id is a UUID so it's safe to use in file paths.
  Path::new(&std::env::var("MIRRORS_DIR").expect("MIRRORS_DIR env var not set"))
    .join(repo_id.0.to_string())
}

async fn git_repo(repo_id: &RepoId) -> CFResult<Repository> {
  let expected_path = mirror_dir(&repo_id);

  // If the repo already exists, then we open and return it.
  if expected_path.exists() && expected_path.is_dir() {
    trace!(
      "Returning existing repo at expected_path {}",
      expected_path.to_string_lossy()
    );
    let repo = Repository::open(&expected_path)?;
    return Ok(repo);
  }

  // Lookup repo url.
  let github_node_id = hasura::repo_id_to_github_node_id(repo_id)
    .await?
    .ok_or_else(|| format_err!("can't find github node id for repo {}", repo_id.0))?;
  let repo_url = github::repo_url(&github_node_id).await?.ok_or_else(|| {
    format_err!(
      "can't find github repository with node id {}",
      github_node_id
    )
  })?;

  info!("Cloning repo {}...", repo_url);
  // TODO how to actually make this a --mirror clone with git2-rs?
  // let repo = RepoBuilder::new()
  //   .bare(true)
  //   .clone(&repo_url, &expected_path)?;
  let git_clone_successful = std::process::Command::new("git")
    .arg("clone")
    .arg("--mirror")
    .arg(repo_url)
    .arg(&expected_path)
    .status()?
    .success();
  ensure!(git_clone_successful, "git clone was not successful");
  info!("Clone complete.");

  let repo = Repository::open(&expected_path)?;

  // TODO: Check disk space and send alert once it passes 50%.

  Ok(repo)
}

/// Does the given commit exist in the local repo?
fn commit_exists(repo: &Repository, commit: &str) -> bool {
  match repo.revparse_single(commit) {
    Err(_) => false,
    Ok(obj) => obj.as_commit().is_some(),
  }
}

async fn git_blame(repo_id: &RepoId, file_path: &str, commit: &str) -> CFResult<Vec<BlameLine>> {
  trace!(
    "git_blame repo_id = {}, file_path = {}, commit = {}",
    repo_id.0,
    file_path,
    commit
  );

  // Check if this stuff exists in hasura blamelines table. If so, return that.
  if let Some(blamelines) = hasura::get_blame_lines(repo_id, file_path, commit).await? {
    return Ok(blamelines);
  }

  // Check if repo_id is cloned in the filesystem. If not then do a clone.
  let repo = git_repo(repo_id).await?;

  // Do a `git remote update` or `git pull` if need be. We may have already
  // pulled this commit to get the blame on a different file, or it may have
  // gotten pulled down incidentally previously.
  if !commit_exists(&repo, commit) {
    info!(
      "Commit {} not found in repo {}. Pulling all changes.",
      commit, repo_id.0
    );

    // TODO: figure out how to get git2-rs to do the same thing.
    let git_remote_update_successful = std::process::Command::new("git")
      .arg("remote")
      .arg("update")
      .current_dir(mirror_dir(&repo_id))
      .status()?
      .success();
    ensure!(git_remote_update_successful);
  }
  ensure!(
    commit_exists(&repo, commit),
    "commit still doesn't exist after pulling"
  );

  // Run git blame
  trace!("Running git blame...");
  let blame = repo.blame_file(Path::new(file_path), None)?;
  trace!("... git blame done");

  // Calculate blameline info.
  let mut blamelines = vec![];
  for blamehunk in blame.iter() {
    // The .path() should only ever be None in unicode situations on Windows
    // (https://docs.rs/git2/0.11.0/git2/struct.BlameHunk.html#method.path).
    let hunk_file_path = blamehunk
      .path()
      .expect("Could not get BlameHunk.path()")
      .to_string_lossy()
      .to_string();
    let hunk_commit = blamehunk.orig_commit_id().to_string();
    let hunk_start_line = blamehunk.orig_start_line();

    for hunkline in 0..blamehunk.lines_in_hunk() {
      blamelines.push(BlameLine {
        original_commit: hunk_commit.clone(),
        original_file_path: hunk_file_path.clone(),
        original_line_number: (hunk_start_line + hunkline) as i32,
      });
    }
  }

  // TODO: Insert blamelines into hasura in one transaction.

  Ok(blamelines)
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

// TODO: start thread should return the new thread object, not blamelines.
#[juniper::graphql_object]
impl Mutation {
  async fn startGitHubThread(
    github_repo_id: String,
    file_path: String,
    last_file_commit: String,
    comment_content: String,
  ) -> FieldResult<Vec<BlameLine>> {
    info!("startGitHubThread mutation");

    let run = async || -> CFResult<Vec<BlameLine>> {
      // TODO: Check that the user is allowed read access to the repo. For now
      // all repos must be public.

      // Lookup our repo_id for the github_node_id. This will create a new one
      // if we aren't yet tracking this repo.
      let repo_id = hasura::github_node_id_to_repo_id(&github_repo_id).await?;

      // Get blame info for the repo_id at last_file_commit
      let blame = git_blame(&repo_id, &file_path, &last_file_commit).await?;

      // TODO: Insert new thread in hasura

      Ok(blame)
    };

    run().await.map_err(|err| {
      error!("{:?}", err);
      juniper::FieldError::new("internal server error", juniper::Value::Null)
    })
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
