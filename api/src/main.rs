mod auth;
mod github;
mod hasura;
use anyhow::bail;
use anyhow::ensure;
use anyhow::format_err;
use anyhow::Result;
use git2::BlameOptions;
use git2::Oid;
use git2::Repository;
use hyper;
use hyper::server::Server;
use hyper::service::make_service_fn;
use hyper::service::service_fn;
use hyper::Body;
use hyper::Method;
use hyper::Response;
use hyper::StatusCode;
use juniper::EmptySubscription;
use juniper::FieldResult;
use juniper::GraphQLObject;
use juniper::RootNode;
use lazy_static::lazy_static;
use log::info;
use log::trace;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;

type GitHubUserId = u64;

/// RepoId identifies a repository. See the README for more info.
pub enum RepoId {
  GitHubRepo { owner: String, name: String },
}

impl ToString for RepoId {
  fn to_string(&self) -> String {
    match self {
      RepoId::GitHubRepo { owner, name } => format!("github-{}!{}", owner, name),
    }
  }
}

/// Parse a string like "github-cuddlefish-app!cuddlefish" into a `RepoId`.
fn parse_repo_id(repo_id: &str) -> Result<RepoId> {
  let rest = repo_id
    .strip_prefix("github-")
    .ok_or(format_err!("bad repo_id"))?;
  let split = rest.split('!').collect::<Vec<_>>();
  match split[..] {
    [owner, name] => Ok(RepoId::GitHubRepo {
      owner: owner.into(),
      name: name.into(),
    }),
    _ => bail!("bad repo_id"),
  }
}

#[derive(Debug, GraphQLObject)]
pub struct BlameLine {
  original_commit: String,
  original_file_path: String,
  // i32 is the only primitive integer type supported by juniper.
  original_line_number: i32,
}

fn mirror_dir(repo_id: &RepoId) -> PathBuf {
  // repo_id has its `/`s escaped, so it's safe as a file path.
  Path::new(&*MIRRORS_DIR).join(repo_id.to_string())
}

/// Get a Repository object for a given RepoId. If we already have the repo cloned, great. If not, clone it first.
async fn git_repo(repo_id: &RepoId) -> Result<Repository> {
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

  // We could also fetch this from the GitHub API, but it's really pretty easy to just do it ourselves.
  let repo_url = match repo_id {
    RepoId::GitHubRepo { owner, name } => format!("https://github.com/{}/{}", owner, name),
  };
  info!("repo_url = {}", repo_url);

  info!("Cloning repo {}...", repo_url);
  // TODO how to actually make this a --mirror clone with git2-rs?
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

async fn git_blame(repo_id: &RepoId, commit: &str, file_path: &str) -> Result<Vec<BlameLine>> {
  trace!(
    "git_blame repo_id = \"{}\", commit = \"{}\", file_path = \"{}\"",
    repo_id.to_string(),
    file_path,
    commit
  );

  // Check if repo_id is cloned in the filesystem. If not then do a clone.
  let repo = git_repo(repo_id).await?;

  // Do a `git remote update` or `git pull` if need be. We may have already
  // pulled this commit to get the blame on a different file, or it may have
  // gotten pulled down incidentally previously.
  if !commit_exists(&repo, commit) {
    info!(
      "Commit {} not found in repo {}. Pulling all changes.",
      commit,
      repo_id.to_string()
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
  let blame = repo.blame_file(
    Path::new(file_path),
    Some(BlameOptions::new().newest_commit(Oid::from_str(commit)?)),
  )?;
  trace!("... git blame done");

  // Calculate blameline info.
  let mut blamelines = vec![];
  for blamehunk in blame.iter() {
    // Re expect here: The .path() should only ever be None in unicode situations on Windows
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

  Ok(blamelines)
}

struct Query;

#[juniper::graphql_object]
impl Query {
  // See https://github.com/hasura/graphql-engine/issues/5621.
  async fn noop() -> FieldResult<bool> {
    Ok(true)
  }
}

struct Mutation;

#[juniper::graphql_object]
impl Mutation {
  // There are situations in which it makes sense to allow anonymous users to call this endpoint. Eg, there are comments
  // on a file but its latest commit version has not been git blamed yet, so the line association info is not yet
  // present in the blamelines table. Return value is whether or not we had cached values already.
  async fn CalculateBlameLines(
    repo_id: String,
    last_commit: String,
    file_path: String,
  ) -> FieldResult<bool> {
    trace!(
      "CalculateBlameLines repo_id = \"{}\", last_commit = \"{}\", file_path = \"{}\"",
      repo_id.to_string(),
      last_commit,
      file_path,
    );

    // Check if it's already in the database to save a few electrons here.
    if hasura::lookup_existing_blamelines(&last_commit, &file_path).await? {
      trace!("blamelines already exist in hasura!");
      Ok(true)
    } else {
      trace!("blamelines do not yet exist in hasura.");
      // Not in the database, have to calculate the git blame.
      let repo_id_parsed = parse_repo_id(&repo_id)?;
      let blamelines = git_blame(&repo_id_parsed, &last_commit, &file_path).await?;
      // Insert into the blamelines table. Existing values ok.
      hasura::insert_blamelines(&last_commit, &file_path, blamelines).await?;
      Ok(false)
    }
  }
}

lazy_static! {
  static ref HASURA_GRAPHQL_ADMIN_SECRET: String = std::env::var("HASURA_GRAPHQL_ADMIN_SECRET")
    .expect("HASURA_GRAPHQL_ADMIN_SECRET env var not set");
  static ref GITHUB_OAUTH_CLIENT_ID: String =
    std::env::var("GITHUB_OAUTH_CLIENT_ID").expect("GITHUB_OAUTH_CLIENT_ID env var not set");
  static ref GITHUB_OAUTH_CLIENT_SECRET: String = std::env::var("GITHUB_OAUTH_CLIENT_SECRET")
    .expect("GITHUB_OAUTH_CLIENT_SECRET env var not set");
  static ref API_PASETO_SECRET_KEY: String =
    std::env::var("API_PASETO_SECRET_KEY").expect("API_PASETO_SECRET_KEY env var not set");
  static ref HASURA_HOST: String =
    std::env::var("HASURA_HOST").expect("HASURA_HOST env var not set");
  static ref HASURA_PORT: String =
    std::env::var("HASURA_PORT").expect("HASURA_PORT env var not set");
  static ref MIRRORS_DIR: String =
    std::env::var("MIRRORS_DIR").expect("MIRRORS_DIR env var not set");

  // Whether or not we're running on render at all, either in prod or as an
  // ephemeral PR environment. See https://render.com/docs/environment-variables.
  static ref RUNNING_ON_RENDER: bool = std::env::var("RENDER") == Ok("true".to_string());
}

#[tokio::main]
async fn main() {
  env_logger::init();

  // Fail fast if we're missing environment variables we need.
  lazy_static::initialize(&HASURA_GRAPHQL_ADMIN_SECRET);
  lazy_static::initialize(&GITHUB_OAUTH_CLIENT_ID);
  lazy_static::initialize(&GITHUB_OAUTH_CLIENT_SECRET);
  lazy_static::initialize(&API_PASETO_SECRET_KEY);
  lazy_static::initialize(&HASURA_HOST);
  lazy_static::initialize(&HASURA_PORT);
  lazy_static::initialize(&RUNNING_ON_RENDER);

  info!("Starting with settings:");
  info!("GITHUB_OAUTH_CLIENT_ID = {}", *GITHUB_OAUTH_CLIENT_ID);
  info!("MIRRORS_DIR = {}", *MIRRORS_DIR);
  info!("HASURA_HOST = {}", *HASURA_HOST);
  info!("HASURA_PORT = {}", *HASURA_PORT);
  info!("RUNNING_ON_RENDER = {}", *RUNNING_ON_RENDER);
  info!(
    "RENDER_EXTERNAL_URL = {:?}",
    std::env::var("RENDER_EXTERNAL_URL")
  );

  let root_node = Arc::new(RootNode::new(
    Query,
    Mutation,
    EmptySubscription::<()>::new(),
  ));

  let make_service = make_service_fn(|_| {
    let root_node = root_node.clone();
    async {
      Ok::<_, hyper::Error>(service_fn(move |req| {
        let root_node = root_node.clone();
        async {
          let start_time = std::time::Instant::now();
          let method = req.method().clone();
          // .path() drops ?k=v and #asdf stuff.
          let uri = req.uri().path().to_owned();

          // Too many nuisance logs for /healthz...
          if (&method, uri.as_ref()) != (&Method::GET, "/healthz") {
            info!("--> {} {}", method, uri);
          }

          (match (&method, uri.as_ref()) {
            // TODO: turn off graphiql in prod.
            (&Method::GET, "/") => Ok(juniper_hyper::graphiql("/graphql", None).await),
            (&Method::GET, "/graphql") | (&Method::POST, "/graphql") => {
              Ok(juniper_hyper::graphql(root_node, Arc::new(()), req).await)
            }

            (&Method::GET, "/healthz") => Ok(
              Response::builder()
                .status(StatusCode::OK)
                .body(Body::empty())
                .expect("failed to construct response"),
            ),

            (&Method::GET, "/login") => auth::login_route(req).await,
            (&Method::GET, "/oauth/callback/github") => auth::github_callback_route(req).await,
            (&Method::GET, "/logout") => auth::logout_route(req).await,
            (&Method::GET, "/hasura_auth_webhook") => auth::hasura_auth_webhook(req).await,

            _ => Ok(
              Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::empty())
                .expect("failed to construct response"),
            ),
          })
          .and_then(|resp| {
            if (&method, uri.as_ref()) != (&Method::GET, "/healthz") {
              info!(
                "<-- {} {} {} {}ms",
                method,
                uri,
                resp.status().as_u16(),
                start_time.elapsed().as_millis()
              );
            }
            Ok(resp)
          })
        }
      }))
    }
  });

  // The frontend uses 3000 by default, and this one is easier to configure.
  // See https://community.render.com/t/502-bad-gateway-errors/616/4?u=samuela.
  let addr = ([0, 0, 0, 0], 3001).into();
  let server = Server::bind(&addr).serve(make_service);
  println!("Listening on http://{}", addr);

  if let Err(e) = server.await {
    eprintln!("server error: {}", e)
  }
}
