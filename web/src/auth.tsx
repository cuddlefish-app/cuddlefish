import * as Cookies from "js-cookie";

type Anonymous = { isLoggedIn: false };
export type UserInfo = {
  github_login: string;
  github_id: number;
  name: string;
};
type LoggedIn = { isLoggedIn: true; user: UserInfo };
type AuthState = Anonymous | LoggedIn;

// TODO: we should probably store message drafts in localstorage, and then
// NewThreadRedirect and NewCommentRedirect can be combined.
type NewThreadRedirect = {
  kind: "new_thread";
  line: number;
  message: string;
};
type NewCommentRedirect = {
  kind: "new_comment";
  line: number;
  message: string;
};
type NoopRedirect = {
  kind: "noop";
};
export type RedirectMemo =
  | NewThreadRedirect
  | NewCommentRedirect
  | NoopRedirect;

const USER_INFO_COOKIE_NAME = "cf_user_info";

export function useAuthState(): AuthState {
  // undefined when the cookie is not set, empty string when the user has been logged out.
  const userCookie = Cookies.getJSON(USER_INFO_COOKIE_NAME) as
    | undefined
    | ""
    | UserInfo;
  if (userCookie === undefined || userCookie === "") {
    return { isLoggedIn: false };
  } else {
    return { isLoggedIn: true, user: userCookie };
  }
}

/// Redirect to login flow and remember `appState`. When returning to the app,
/// we check `appState` to see what path to return to.
export function loginWithRedirect(
  returnTo: string,
  redirectMemo: RedirectMemo
) {
  localStorage.setItem("returnTo", returnTo);
  localStorage.setItem("redirectMemo", JSON.stringify(redirectMemo));
  if (process.env.NODE_ENV === "production") {
    // TODO this won't work with render's PR previews.
    window.location.href = "https://api.cuddlefish.app/login";
  } else {
    window.location.href = "//localhost:3001/login";
  }
}

export function logout() {
  if (process.env.NODE_ENV === "production") {
    // TODO this won't work with render's PR previews.
    window.location.href = "https://api.cuddlefish.app/logout";
  } else {
    window.location.href = "//localhost:3001/logout";
  }
}
