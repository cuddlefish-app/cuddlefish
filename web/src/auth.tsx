import * as Cookies from "js-cookie";

type Anonymous = { isLoggedIn: false };
export type UserInfo = {
  github_login: string;
  github_id: number;
  name: string;
};
type LoggedIn = { isLoggedIn: true; user: UserInfo };
type AuthState = Anonymous | LoggedIn;

export function useAuthState(): AuthState {
  // undefined when the cookie is not set.
  const userCookie = Cookies.getJSON("user") as undefined | UserInfo;
  if (userCookie === undefined) {
    return { isLoggedIn: false };
  } else {
    return { isLoggedIn: true, user: userCookie };
  }
}

/// Redirect to login flow and remember `appState`. When returning to the app,
/// we check `appState` to see what path to return to.
export function loginWithRedirect(appState: {}) {
  // TODO put appState into local storage.
  // TODO don't hardcode this
  window.location.replace("//localhost:3001/login");
}

export function logout() {
  window.location.replace("//localhost:3001/logout");
}
