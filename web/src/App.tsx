import { Auth0Provider } from "@auth0/auth0-react";
import { Octokit } from "@octokit/core";
import React, { useEffect, useState } from "react";
import { RelayEnvironmentProvider } from "react-relay/hooks";
import {
  BrowserRouter,
  Route,
  Switch,
  useHistory,
  useParams,
} from "react-router-dom";
import "./App.css";
import CodeAndComments from "./CodeAndComments";
import Header from "./Header";
import relayenv from "./relay-env";

// GitHub API v4 doesn't yet support usage without authentication: https://github.community/t/api-v4-permit-access-without-token/13833.

export function internalError(error?: Error) {
  if (error) console.log(error);
  window.alert(
    "Oops! Cuddlefish made a booboo. Please check the console for any messages, and pester some humans by creating an issue on GitHub!"
  );

  // This helps us do things like `{ onError: internalError }`.
  throw error;
}

export function githubRepoId(repo_owner: string, repo_name: string) {
  return `github-${repo_owner}!${repo_name}`;
}

// See https://auth0.com/blog/complete-guide-to-react-user-authentication/.
const CustomAuthProvider: React.FC = ({ children }) => {
  const history = useHistory();
  return (
    <Auth0Provider
      domain="cuddlefish.auth0.com"
      clientId="PuC9rXk3lxuojdAq5reaa5CB3ibgDH2a"
      redirectUri={window.location.origin}
      onRedirectCallback={(appState) => {
        history.push(appState.returnTo || window.location.pathname);
      }}
    >
      {children}
    </Auth0Provider>
  );
};

function App() {
  return (
    <RelayEnvironmentProvider environment={relayenv}>
      <BrowserRouter>
        {/* Note that CustomAuthProvider must be a child of BrowserRouter. See https://auth0.com/blog/complete-guide-to-react-user-authentication/. */}
        <CustomAuthProvider>
          <Header />
          <Switch>
            <Route path="/:owner/:repo/blob/:branch/*">
              <BlobPage />
            </Route>
            <Route path="/">home page</Route>
            <Route component={NotFound} />
          </Switch>
        </CustomAuthProvider>{" "}
      </BrowserRouter>
    </RelayEnvironmentProvider>
  );
}

// Get the latest commit for a branch of a GitHub repo.
function useLatestCommitSHA(
  repo_owner: string,
  repo_name: string,
  branch: string
) {
  const [commitSHA, setCommitSHA] = useState(null as null | string);

  useEffect(() => {
    const octokit = new Octokit();
    (async () => {
      try {
        const commitResponse = await octokit.request(
          "GET /repos/:owner/:repo/commits/:branch",
          {
            owner: repo_owner,
            repo: repo_name,
            branch,
          }
        );
        setCommitSHA(commitResponse.data.sha);
      } catch (error) {
        // TODO: 404 when the repo doesn't exist or it's just not public.
        throw internalError(error);
      }
    })();
  }, [repo_owner, repo_name, branch]);

  return commitSHA;
}

function BlobPage() {
  // For whatever reason, react-router dumps the wildcard path match into key 0.
  const { 0: filePath, owner, repo, branch } = useParams() as {
    0: any;
    owner: string;
    repo: string;
    branch: string;
  };
  const commitSHA = useLatestCommitSHA(owner, repo, branch);
  if (commitSHA !== null)
    return (
      <CodeAndComments
        repo_owner={owner}
        repo_name={repo}
        filePath={filePath}
        commitSHA={commitSHA}
      />
    );
  else return <div>fetching latest commit...</div>;
}

function NotFound() {
  return <div>404</div>;
}

export default App;
