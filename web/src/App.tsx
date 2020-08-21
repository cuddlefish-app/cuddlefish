import { Octokit } from "@octokit/core";
import React, { Suspense, useEffect, useState } from "react";
import { RelayEnvironmentProvider } from "react-relay/hooks";
import { BrowserRouter, Route, Switch, useParams } from "react-router-dom";
import "./App.css";
import CodeAndComments from "./CodeAndComments";
import relayenv from "./relay-env";

// GitHub API v4 doesn't yet support usage without authentication: https://github.community/t/api-v4-permit-access-without-token/13833.

export function internalError() {
  window.alert(
    "Oops! Cuddlefish made a booboo. Please check the console for any messages, and pester some humans by creating an issue on GitHub!"
  );
}

function useAsyncEffect(eff: () => Promise<any>) {
  useEffect(() => {
    eff();
  });
}

function App() {
  return (
    <RelayEnvironmentProvider environment={relayenv}>
      <BrowserRouter>
        <Switch>
          <Route path="/:owner/:repo/blob/:branch/*">
            {/* TODO: make suspense more interesting! We get suspense while waiting on Relay queries. */}
            <Suspense fallback={<div>suspense!</div>}>
              <BlobPage />
            </Suspense>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    </RelayEnvironmentProvider>
  );
}

function BlobPage() {
  // For whatever reason, react-router dumps the wildcard path match into key 0.
  const { 0: filePath, owner, repo, branch } = useParams() as {
    0: any;
    owner: string;
    repo: string;
    branch: string;
  };

  const octokit = new Octokit();
  // TODO use other hooks, eg useMemo here instead.
  const [commitSHA, setCommitSHA] = useState(null as null | string);
  const [fileContents, setFileContents] = useState(null as null | string);

  useAsyncEffect(async () => {
    try {
      const commitResponse = await octokit.request(
        "GET /repos/:owner/:repo/commits/:branch",
        {
          owner,
          repo,
          branch,
        }
      );
      setCommitSHA(commitResponse.data.sha);
    } catch (error) {
      // TODO: 404 when the repo doesn't exist or it's just not public.
      console.error(error);
    }
  });

  useAsyncEffect(async () => {
    if (commitSHA == null) {
      setFileContents(null);
      return;
    }
    try {
      const fileResponse = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${commitSHA}/${filePath}`
      );
      setFileContents(await fileResponse.text());
    } catch (error) {
      // TODO: 404 when the file/repo doesn't exist or it's just not public.
      console.error(error);
    }
  });

  if (fileContents !== null && commitSHA !== null)
    return (
      <CodeAndComments
        repo_owner={owner}
        repo_name={repo}
        filePath={filePath}
        fileContents={fileContents}
        commitSHA={commitSHA}
      ></CodeAndComments>
    );
  else return <div>hold on...</div>;
}

function NotFound() {
  return <div>404</div>;
}

export default App;
