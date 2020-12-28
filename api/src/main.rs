mod github;
mod hasura;
use chrono::{prelude::Utc, Duration};
use cookie::{Cookie, SameSite};
use failure::bail;
use failure::ensure;
use failure::format_err;
use failure::Error;
use git2::BlameOptions;
use git2::Oid;
use git2::Repository;
use hasura::upsert_user;
use hyper::header;
use hyper::service::make_service_fn;
use hyper::service::service_fn;
use hyper::Body;
use hyper::Method;
use hyper::Response;
use hyper::Server;
use hyper::StatusCode;
use hyper::{self, Request};
use juniper::EmptySubscription;
use juniper::FieldResult;
use juniper::GraphQLObject;
use juniper::RootNode;
use lazy_static::lazy_static;
use log::error;
use log::info;
use log::trace;
use serde::Deserialize;
use std::collections::HashMap;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;

type CFResult<T> = Result<T, Error>;

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
fn parse_repo_id(repo_id: &str) -> CFResult<RepoId> {
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
  Path::new(&std::env::var("MIRRORS_DIR").expect("MIRRORS_DIR env var not set"))
    .join(repo_id.to_string())
}

/// Get a Repository object for a given RepoId. If we already have the repo cloned, great. If not, clone it first.
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

async fn git_blame(repo_id: &RepoId, commit: &str, file_path: &str) -> CFResult<Vec<BlameLine>> {
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

// TODO: move auth stuff into a separate file.
async fn login_route(_: Request<Body>) -> Result<Response<Body>, hyper::Error> {
  // See https://docs.github.com/en/free-pro-team@latest/developers/apps/authorizing-oauth-apps#1-request-a-users-github-identity.
  // We use a local token since there's really no need for the client to be able
  // to read anything in it.
  let state = paseto::tokens::PasetoBuilder::new()
    .set_encryption_key(Vec::from(&*API_PASETO_SECRET_KEY.as_bytes()))
    .set_expiration(Utc::now() + Duration::minutes(15))
    .set_not_before(Utc::now())
    .build()
    .expect("failed to construct paseto token");

  // See https://serverfault.com/questions/391181/examples-of-302-vs-303 for a
  // breakdown of all possible HTTP redirects.
  Ok::<_, hyper::Error>(
    Response::builder()
      .status(StatusCode::TEMPORARY_REDIRECT)
      .header(
        header::LOCATION,
        format!(
          "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&state={}",
          &*GITHUB_OAUTH_CLIENT_ID, "http://localhost:3001/oauth/callback/github", state
        ),
      )
      .body(Body::empty())
      .expect("building response failed"),
  )
}
async fn github_callback_route_inner(req: Request<Body>) -> Result<Response<Body>, ()> {
  // See https://users.rust-lang.org/t/using-hyper-how-to-get-url-query-string-params/23768/3?u=samuela.

  let query_params = req
    .uri()
    .query()
    .map(|v| {
      url::form_urlencoded::parse(v.as_bytes())
        .into_owned()
        .collect()
    })
    .unwrap_or_else(HashMap::new);

  let code = query_params.get("code").ok_or(())?;
  let state = query_params.get("state").ok_or(())?;

  // TODO: test calling this endpoint with an invalid/expired paseto token.

  // Test that we actually initiated this login flow to prevent CSRF attacks.
  // See https://owasp.org/www-community/attacks/csrf. Note that we are
  // protecting ourselves against an attacker attempting to redirect to us
  // without being able to man-in-the-middle anything. We are still vulnerable
  // to replay attacks assuming an attacker could get their hands on one of our
  // paseto tokens. This is much, much less likely however. Perhaps there are
  // other preventions for that kind of attack as well?

  // Also note that the risk of CSRF attack is greatly mitigated by the fact
  // that we create and enter a session for the user based on the access token
  // after calling the GitHub API user info endpoint, not from any other user
  // information (a cookie, etc). This means that it should not be possible for
  // an attacker to associate a malicious access token to victim's user account.
  // I suppose however that there's still the possibility the user doesn't
  // recognize that they've been logged in to the wrong account, and still
  // exposes some information thinking that they're logged in to their correct
  // account.

  // TODO maybe do something more user-friendly when their login link has
  // expired
  paseto::tokens::validate_local_token(&state, None, Vec::from(&*API_PASETO_SECRET_KEY.as_bytes()))
    .map_err(|_| ())?;

  // Trade in code for an access token from GitHub.
  let access_token_response = reqwest::Client::new()
    .post("https://github.com/login/oauth/access_token")
    .header("Accept", "application/json")
    .query(&[
      ("client_id", &*GITHUB_OAUTH_CLIENT_ID),
      ("client_secret", &*GITHUB_OAUTH_CLIENT_SECRET),
      ("code", code),
      ("state", state),
    ])
    .send()
    .await
    // Turn error status codes into rust errors.
    .and_then(|resp| resp.error_for_status())
    .map_err(|_| {
      error!("error getting the github access token");
      ()
    })?;

  #[derive(Deserialize)]
  struct AccessTokenResp {
    access_token: String,
  }
  // Deserialize the access token response into an access token.
  let access_token = access_token_response
    .json::<AccessTokenResp>()
    .await
    .map_err(|_| {
      error!("failed to parse the response body from github.com/login/oauth/access_token");
      ()
    })?
    .access_token;

  // TODO: maybe use the gql way?
  let user_info_response = reqwest::Client::new()
    .get("https://api.github.com/user")
    .header("Authorization", format!("token {}", access_token))
    // Setting a user agent is mandatory when calling api.github.com.
    .header("User-Agent", "cuddlefish")
    .send()
    .await
    // Turn error status codes into rust errors.
    .and_then(|resp| resp.error_for_status())
    .map_err(|_| {
      error!("error calling api.github.com/user");
      ()
    })?;

  #[derive(Deserialize, Debug)]
  struct UserInfoResp {
    login: String,
    id: u64,
    node_id: String,
    name: String,
    // This comes in as null sometimes. Serde seems to handle correctly.
    company: Option<String>,
    blog: Option<String>,
    location: Option<String>,
    email: Option<String>,
    hireable: bool,
    bio: String,
    twitter_username: Option<String>,
  }
  // Deserialize the user info response.
  let user_info: UserInfoResp = user_info_response.json().await.map_err(|_| {
    error!("failed to parse the response body from github.com/login/oauth/access_token");
    ()
  })?;

  // upsert user info
  upsert_user(
    user_info.id,
    &user_info.name,
    &user_info.node_id,
    &user_info.login,
    user_info.email,
  )
  .await
  .map_err(|_| {
    error!("failed to upsert user info");
    ()
  })?;

  // create new user session
  let session_token = hasura::start_user_session(user_info.id)
    .await
    .map_err(|_| {
      error!("failed to create new user session");
      ()
    })?;

  // set cookie in response with session token
  // TODO: set domain to allow subdowmain access.
  // TODO: should use __Host- prefix here?
  let cookie = Cookie::build("session_token", session_token)
    // Only send this cookie over HTTPS or to localhost.
    .secure(true)
    // Cookie is not accessible via JavaScript.
    .http_only(true)
    // Only send this cookie for requests originating from our domain.
    .same_site(SameSite::Strict)
    .finish();

  // TODO: redirect somewhere...
  Ok(
    Response::builder()
      .header(hyper::header::SET_COOKIE, format!("{}", cookie))
      .body(Body::empty())
      .expect("building response failed"),
  )
}
async fn github_callback_route(req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
  // See https://docs.github.com/en/free-pro-team@latest/developers/apps/authorizing-oauth-apps#2-users-are-redirected-back-to-your-site-by-github.
  // TODO simplify
  match github_callback_route_inner(req).await {
    Ok(resp) => Ok(resp),
    Err(_) => Ok(
      Response::builder()
        .status(StatusCode::BAD_REQUEST)
        .body(Body::empty())
        .expect("building response failed"),
    ),
  }
}
async fn logout_route(_: Request<Body>) -> Result<Response<Body>, hyper::Error> {
  // Delete GH access token
  // Delete session from db
  // Delete cookie
  // redirect to the homepage?

  let mut response = Response::new(Body::empty());
  *response.status_mut() = StatusCode::NOT_IMPLEMENTED;
  Ok::<_, hyper::Error>(response)
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
}

#[tokio::main]
async fn main() {
  env_logger::init();

  // Fail fast if we're missing environment variables we need.
  lazy_static::initialize(&HASURA_GRAPHQL_ADMIN_SECRET);
  lazy_static::initialize(&GITHUB_OAUTH_CLIENT_ID);
  lazy_static::initialize(&GITHUB_OAUTH_CLIENT_SECRET);
  lazy_static::initialize(&API_PASETO_SECRET_KEY);

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
          info!("--> {} {}", method, uri);

          (match (&method, uri.as_ref()) {
            // TODO: turn off graphiql in prod.
            (&Method::GET, "/") => juniper_hyper::graphiql("/graphql", None).await,
            (&Method::GET, "/graphql") | (&Method::POST, "/graphql") => {
              juniper_hyper::graphql(root_node, Arc::new(()), req).await
            }
            (&Method::GET, "/login") => login_route(req).await,
            (&Method::GET, "/oauth/callback/github") => github_callback_route(req).await,
            (&Method::GET, "/logout") => logout_route(req).await,

            _ => Ok::<_, hyper::Error>(
              Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::empty())
                .expect("failed to construct response"),
            ),
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

  // The frontend uses 3000 by default, and this one is easier to configure.
  let addr = ([127, 0, 0, 1], 3001).into();
  let server = Server::bind(&addr).serve(make_service);
  println!("Listening on http://{}", addr);

  if let Err(e) = server.await {
    eprintln!("server error: {}", e)
  }
}
