import { useAuth0 } from "@auth0/auth0-react";
import { Avatar, Button } from "@primer/components";
import React from "react";

const UserAvatarDropDown: React.FC = () => {
  const { user } = useAuth0();
  return <Avatar src={user.picture} marginTop={1} />;
};

const Header: React.FC = (props) => {
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();
  return (
    <div className="Header">
      <div className="Header-item">
        <a href="#" className="Header-link f4 d-flex flex-items-center">
          <span>Cuddlefish</span>
        </a>
      </div>

      <div className="Header-item">
        <input type="search" className="form-control input-dark" />
      </div>
      <div className="Header-item Header-item--full">Menu</div>
      {isAuthenticated ? (
        <div className="Header-item mr-0">
          <UserAvatarDropDown />
        </div>
      ) : null}
      <Button
        onClick={() =>
          loginWithRedirect({
            appState: { returnTo: window.location.pathname },
          })
        }
      >
        Sign in
      </Button>
      <Button onClick={() => logout({ returnTo: window.location.origin })}>
        Log out
      </Button>
    </div>
  );
};

export default Header;
