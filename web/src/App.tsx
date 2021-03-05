import { Octokit } from "@octokit/core";
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Route,
  Switch,
  useHistory,
  useParams,
} from "react-router-dom";
import "./App.css";
import CodeAndComments from "./CodeAndComments";
import CustomRelayEnvProvider from "./CustomRelayEnvProvider";
import Header from "./Header";

// GitHub API v4 doesn't yet support usage without authentication: https://github.community/t/api-v4-permit-access-without-token/13833.

export function internalError(error?: Error) {
  if (error) console.error(error);
  window.alert(
    "Oops! Cuddlefish experienced an internal error :( Please check the console for any messages, and pester some humans by creating an issue on GitHub!"
  );

  // This helps us do things like `{ onError: internalError }`.
  throw error;
}

export function githubRepoId(repo_owner: string, repo_name: string) {
  return `github-${repo_owner}!${repo_name}`;
}

// TODO: this doesn't really need to be a component
const CustomRedirectProvider: React.FC = ({ children }) => {
  const history = useHistory();
  // This comes out as null for keys that don't exist, and a string otherwise.
  const returnTo = localStorage.getItem("returnTo");
  if (typeof returnTo === "string") {
    const redirectState_raw = localStorage.getItem("redirectMemo");
    if (redirectState_raw === null)
      throw internalError(Error("no redirectMemo in localStorage"));
    history.push(returnTo, JSON.parse(redirectState_raw));
    localStorage.removeItem("returnTo");
    localStorage.removeItem("redirectMemo");
  }
  return <>{children}</>;
};

function App() {
  // TODO:
  //   * /:owner/:repo
  //   * /:owner/:repo/blob/:branch/path_to_dir_not_file doesn't work, gives weird 404 and calcblamelines errors out
  return (
    <BrowserRouter>
      <CustomRedirectProvider>
        <CustomRelayEnvProvider>
          <Header />
          <Switch>
            <Route path="/:owner/:repo/blob/:branch/*">
              <BlobPage />
            </Route>
            <Route path="/">home page</Route>
            <Route component={NotFound} />
          </Switch>
        </CustomRelayEnvProvider>
      </CustomRedirectProvider>
    </BrowserRouter>
  );
}

// Get the latest commit for a branch of a GitHub repo.
// TODO: better to use the latest commit that touched the file we're currently looking at, not the whole repo. This is
// hard though. There's no v3 API route for this AFAICT, and ofc v4 API requires an auth_token. See https://stackoverflow.com/questions/15831313/is-it-possible-to-get-commits-history-for-one-file-in-github-api.
function useLatestBranchCommitSHA(
  repo_owner: string,
  repo_name: string,
  branch: string
) {
  const [commitSHA, setCommitSHA] = useState(null as null | string);

  useEffect(() => {
    (async () => {
      // TODO this would prob just be easier with .then().
      try {
        // This can fail with "GET https://api.github.com/repositories/241239708/commits/main 403 (rate limit exceeded)".
        // TODO: we should try to use the user's access token if they're signed in. that'll require proxying through the
        // api server.

        // const octokit = new Octokit({ auth: `Bearer ${accessToken}` });
        const octokit = new Octokit();

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
  const commitSHA = useLatestBranchCommitSHA(owner, repo, branch);
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
