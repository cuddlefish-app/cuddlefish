use crate::hasura;
use crate::GitHubUserId;
use crate::RUNNING_ON_RENDER;
use chrono::prelude::Utc;
use chrono::Duration;
use cookie::Cookie;
use cookie::SameSite;
use hyper;
use hyper::header;
use hyper::Body;
use hyper::Request;
use hyper::Response;
use hyper::StatusCode;
use log::error;
use log::trace;
use serde::Deserialize;
use serde_json::json;
use std::borrow::Cow;
use std::collections::HashMap;

const APPLICATION_JSON: &str = "application/json";
const SESSION_TOKEN_COOKIE_NAME: &str = "cf_session_token";
const USER_INFO_COOKIE_NAME: &str = "cf_user_info";

pub async fn login_route(_: Request<Body>) -> Result<Response<Body>, hyper::Error> {
  // See https://docs.github.com/en/free-pro-team@latest/developers/apps/authorizing-oauth-apps#1-request-a-users-github-identity.
  // We use a local token since there's really no need for the client to be able
  // to read anything in it.
  let state = paseto::tokens::PasetoBuilder::new()
    .set_encryption_key(Vec::from(&*crate::API_PASETO_SECRET_KEY.as_bytes()))
    .set_expiration(Utc::now() + Duration::minutes(15))
    .set_not_before(Utc::now())
    .build()
    .expect("failed to construct paseto token");

  // See https://serverfault.com/questions/391181/examples-of-302-vs-303 for a
  // breakdown of all possible HTTP redirects.

  // Can't use RENDER_EXTERNAL_URL because it's https://cf-api.onrender.com, and
  // we can't do any kind of callback_url wildcard in the GitHub app. This won't
  // work with PR preview environments, so we'll have to figure that out later.
  let callback_url = if *RUNNING_ON_RENDER {
    "https://api.cuddlefish.app/oauth/callback/github"
  } else {
    "http://localhost:3001/oauth/callback/github"
  };
  Ok::<_, hyper::Error>(
    Response::builder()
      .status(StatusCode::TEMPORARY_REDIRECT)
      .header(
        header::LOCATION,
        format!(
          "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&state={}",
          &*crate::GITHUB_OAUTH_CLIENT_ID,
          callback_url,
          state
        ),
      )
      .body(Body::empty())
      .expect("building response failed"),
  )
}

fn cookie<'c, V>(name: &'c str, value: V, http_only: bool) -> Cookie<'c>
where
  V: Into<Cow<'c, str>>,
{
  let mut builder = Cookie::build(name, value)
    // Only send this cookie over HTTPS when running in prod.
    .secure(*RUNNING_ON_RENDER)
    // Cookie is not accessible via JavaScript when http_only is true.
    .http_only(http_only)
    // Only send this cookie for requests originating from our domain.
    .same_site(SameSite::Strict)
    // Must set this otherwise the path is /oauth/callback.
    .path("/");
  if *RUNNING_ON_RENDER {
    // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#define_where_cookies_are_sent.
    // If we didn't set this then the cookie would only be sent to
    // api.cuddlefish.app, and not to other *.cuddlefish.app subdomains.
    builder = builder.domain("cuddlefish.app");
  }
  builder.finish()
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
  trace!("code = {}", code);
  trace!("state = {}", state);

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
  paseto::tokens::validate_local_token(
    &state,
    None,
    Vec::from(&*crate::API_PASETO_SECRET_KEY.as_bytes()),
  )
  .map_err(|_| error!("error validating paseto state token"))?;
  trace!("paseto::tokens::validate_local_token was successful");

  // Trade in code for an access token from GitHub.
  let access_token_response = reqwest::Client::new()
    .post("https://github.com/login/oauth/access_token")
    .header(header::ACCEPT, APPLICATION_JSON)
    .query(&[
      ("client_id", &*crate::GITHUB_OAUTH_CLIENT_ID),
      ("client_secret", &*crate::GITHUB_OAUTH_CLIENT_SECRET),
      ("code", code),
      ("state", state),
    ])
    .send()
    .await
    // Turn error status codes into rust errors.
    .and_then(|resp| resp.error_for_status())
    .map_err(|_| error!("error getting the github access token"))?;
  trace!("access_token_response = {:?}", access_token_response);

  #[derive(Deserialize)]
  struct AccessTokenResp {
    access_token: String,
  }
  // Deserialize the access token response into an access token.
  let access_token = access_token_response
    .json::<AccessTokenResp>()
    .await
    .map_err(|_| {
      error!("failed to parse the response body from github.com/login/oauth/access_token")
    })?
    .access_token;
  trace!("access_token = {}", access_token);

  // TODO: maybe use the gql way?
  let user_info_response = reqwest::Client::new()
    .get("https://api.github.com/user")
    .header(header::AUTHORIZATION, format!("token {}", access_token))
    // Setting a user agent is mandatory when calling api.github.com.
    .header(header::USER_AGENT, "cuddlefish")
    .send()
    .await
    // Turn error status codes into rust errors.
    .and_then(|resp| resp.error_for_status())
    .map_err(|_| error!("error calling api.github.com/user"))?;
  trace!("user_info_response = {:?}", user_info_response);

  #[derive(Deserialize, Debug)]
  struct UserInfoResp {
    login: String,
    id: u64,
    node_id: String,
    // TODO what happens with users that don't have a name set?
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
    error!("failed to parse the response body from github.com/login/oauth/access_token")
  })?;
  trace!("user_info = {:?}", user_info);

  // upsert user info
  hasura::upsert_user(
    user_info.id,
    &user_info.name,
    &user_info.node_id,
    &user_info.login,
    user_info.email,
  )
  .await
  .map_err(|_| error!("failed to upsert user info"))?;
  trace!("upsert_user was successful");

  // create new user session
  let session_token = hasura::start_user_session(user_info.id)
    .await
    .map_err(|_| error!("failed to create new user session"))?;
  trace!("session_token = {}", session_token);

  // set cookie in response with session token
  // TODO: update the logout route to make sure that it's deleting the right stuff.
  // TODO: should use __Host- prefix here?
  let session_token_cookie = cookie(SESSION_TOKEN_COOKIE_NAME, session_token, true);

  // TODO base64 or JWT encode this value... otherwise all kinds of naughty things can happen.
  let user_cookie = cookie(
    USER_INFO_COOKIE_NAME,
    json!({
      "github_login": user_info.login,
      "github_id": user_info.id,
      "name": user_info.name
    })
    .to_string(),
    false,
  );

  trace!("session_token_cookie = {}", session_token_cookie);
  trace!("user_cookie = {}", user_cookie);

  // Return a response setting the cookie and redirecting to the homepage.
  let homepage_url = if *RUNNING_ON_RENDER {
    // TODO this won't work with render's PR previews.
    "https://cuddlefish.app/"
  } else {
    "http://localhost:3000/"
  };
  Ok(
    Response::builder()
      .status(StatusCode::TEMPORARY_REDIRECT)
      .header(header::SET_COOKIE, session_token_cookie.to_string())
      .header(header::SET_COOKIE, user_cookie.to_string())
      .header(header::LOCATION, homepage_url)
      .body(Body::empty())
      .expect("building response failed"),
  )
}
pub async fn github_callback_route(req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
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
pub async fn logout_route(req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
  if let Ok(cookies) = parse_cookies(&req) {
    if let Some(session_token) = cookies.get(SESSION_TOKEN_COOKIE_NAME) {
      // Try ending the user session...
      if let Err(_) = hasura::end_user_session(session_token).await {
        // If we get an Err from end_user_session it means we got some kind of
        // error talking to hasura.
        return Ok(
          Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .body(Body::empty())
            .expect("building response failed"),
        );
      }
    }
  }

  // The path and domain on the cookie must match in order for the delete to
  // work! See https://stackoverflow.com/a/53573622/3880977.
  let session_token_cookie = Cookie::build(SESSION_TOKEN_COOKIE_NAME, "")
    .path("/")
    .expires(time::OffsetDateTime::unix_epoch())
    .finish();

  let user_cookie = Cookie::build(USER_INFO_COOKIE_NAME, "")
    .path("/")
    .expires(time::OffsetDateTime::unix_epoch())
    .finish();

  Ok(
    Response::builder()
      .status(StatusCode::TEMPORARY_REDIRECT)
      .header(header::SET_COOKIE, session_token_cookie.to_string())
      .header(header::SET_COOKIE, user_cookie.to_string())
      // TODO: shouldn't hard code this...
      .header(header::LOCATION, "http://localhost:3000/")
      .body(Body::empty())
      .expect("building response failed"),
  )
}

fn parse_cookies(req: &Request<Body>) -> Result<HashMap<&str, &str>, ()> {
  let cookies_raw = req
    .headers()
    .get("cookie")
    // No cookie header.
    .ok_or(())?
    .to_str()
    // to_str returns a Result.
    .map_err(|_| ())?;
  Ok(
    cookies_raw
      .split("; ")
      .filter_map(|x| {
        // We can simplify this all quite a bit once https://github.com/rust-lang/rust/issues/74773 lands.
        match x.splitn(2, "=").collect::<Vec<_>>().as_slice() {
          [k, v] => Some((k.to_owned(), v.to_owned())),
          _ => None,
        }
      })
      .collect(),
  )
}

// TODO prevent DDoS attacks on this? Maybe obscure the endpoint location?
async fn hasura_auth_webhook_inner(req: Request<Body>) -> Result<GitHubUserId, ()> {
  let cookies = parse_cookies(&req)?;
  let session_token = cookies.get(SESSION_TOKEN_COOKIE_NAME).ok_or(())?;
  let github_user_id = hasura::lookup_user_session(session_token)
    .await
    // Error with user session lookup query.
    .map_err(|_| ())?
    // User session just doesn't exist.
    .ok_or(())?;
  Ok(github_user_id)
}
pub async fn hasura_auth_webhook(req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
  Ok(match hasura_auth_webhook_inner(req).await {
    Ok(github_user_id) => Response::builder()
      .status(StatusCode::OK)
      .body(Body::from(
        // Hasura says all values should be strings. See https://hasura.io/docs/1.0/graphql/core/auth/authentication/webhook.html#success.
        json!({
          "X-Hasura-User-Id": github_user_id.to_string(),
          "X-Hasura-Role": "user"
        })
        .to_string(),
      ))
      .expect("building response failed"),
    Err(_) => Response::builder()
      .status(StatusCode::OK)
      .body(Body::from(
        json!({ "X-Hasura-Role": "anonymous" }).to_string(),
      ))
      .expect("building response failed"),
  })
}

#[cfg(test)]
mod tests {
  use chrono::prelude::Utc;
  use chrono::Duration;

  // See https://github.com/instructure/paseto/issues/37.
  #[test]
  fn paseto_build_validate() {
    let key = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    let state = paseto::tokens::PasetoBuilder::new()
      .set_encryption_key(Vec::from(key.as_bytes()))
      .set_expiration(Utc::now() + Duration::minutes(1))
      .set_not_before(Utc::now())
      .build()
      .expect("failed to construct paseto token");
    // println!("{}", state);
    let validation = paseto::tokens::validate_local_token(&state, None, Vec::from(key.as_bytes()));
    // println!("{:?}", validation);
    assert!(validation.is_ok());
  }

  // reqwest will panic at runtime if it's not happy with the version of tokio
  // that it's provided. That's not cool.
  #[tokio::test]
  async fn basic_reqwest() {
    let resp = reqwest::Client::new()
      .get("https://google.com")
      .send()
      .await;
    assert!(resp.is_ok())
  }
}
