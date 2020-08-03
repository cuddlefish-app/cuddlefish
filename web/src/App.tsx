import { Octokit } from "@octokit/core";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Switch, useParams } from "react-router-dom";
import "./App.css";

// GitHub API v4 doesn't yet support usage without authentication: https://github.community/t/api-v4-permit-access-without-token/13833.

function useAsyncEffect(eff: () => Promise<any>) {
  useEffect(() => {
    eff();
  });
}

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/:owner/:repo/blob/:branch/*">
          <BlobPage />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </BrowserRouter>
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

  return <div>{fileContents}</div>;
}

function NotFound() {
  return <div>404</div>;
}

export default App;
