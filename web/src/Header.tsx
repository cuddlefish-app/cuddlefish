import { Avatar, Button } from "@primer/components";
import React from "react";
import { loginWithRedirect, logout, useAuthState, UserInfo } from "./auth";

const UserAvatarDropDown: React.FC<{ user: UserInfo }> = ({ user }) => {
  return (
    <Avatar
      size={32}
      src={`https://avatars.githubusercontent.com/u/${user.github_id}`}
      marginTop={1}
    />
  );
};

const Header: React.FC = () => {
  const authstate = useAuthState();
  return (
    <div className="Header">
      <div className="Header-item">
        <a href="/" className="Header-link f4 d-flex flex-items-center">
          <span>Cuddlefish</span>
        </a>
      </div>

      {/* <div className="Header-item">
        <input type="search" className="form-control input-dark" />
      </div> */}
      <div className="Header-item Header-item--full"></div>

      {authstate.isLoggedIn ? (
        <div className="Header-item mr-0">
          <UserAvatarDropDown user={authstate.user} />
          <Button onClick={() => logout()} marginLeft={3}>
            Log out
          </Button>
        </div>
      ) : (
        <Button
          onClick={() =>
            loginWithRedirect(window.location.pathname, { kind: "noop" })
          }
        >
          Sign in with GitHub
        </Button>
      )}
    </div>
  );
};

export default Header;
