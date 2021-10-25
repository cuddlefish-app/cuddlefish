import * as child_process from "child_process";
import * as util from "util";
import * as vscode from "vscode";
import { assert, DefaultMap, directoryExists, mapFromEntries } from "./utils";

const exec = util.promisify(child_process.exec);

export const ZERO_HASH = "0000000000000000000000000000000000000000";

// paths -> git repo root paths
const knownGitRepoRoots = new Map<string, string>();

// Find the root directory containing a .git directory if one exists. Otherwise,
// return undefined.
export async function repoRoot(path: vscode.Uri): Promise<string | undefined> {
  assert(path.scheme === "file", "path must be a file:// URI");

  // If we've already found the repo root for this path, return it.
  const cached = knownGitRepoRoots.get(path.path);
  if (cached !== undefined) {
    return cached;
  }

  if (path.path === "/") {
    // We've reached the root of the filesystem.
    return undefined;
  } else {
    const res = (await directoryExists(vscode.Uri.joinPath(path, ".git")))
      ? path.path
      : await repoRoot(vscode.Uri.joinPath(path, ".."));
    if (res !== undefined) {
      knownGitRepoRoots.set(path.path, res);
    }
    return res;
  }
}

export async function getRemotes(repo: string) {
  const { stdout } = await exec(`git remote --verbose`, { cwd: repo });
  const remotes = stdout.split("\n").filter((line) => line.length > 0);
  const result = new Map<string, string>();
  for (const remote of remotes) {
    const [name, urlish] = remote.split("\t");
    // AFAIK type can be either "(fetch)" or "(push)". We don't bother caring
    // for now.
    const [url, _type] = urlish.split(" ");
    result.set(name, url);
  }
  return result;
}

type GitHubRepo = {
  owner: string;
  repo: string;
};

// This must match the spec also used on the backend. Currently we only support
// GitHub.
export function repoId(repo: GitHubRepo): string {
  return `github-${repo.owner}!${repo.repo}`;
}

export async function getGitHubRemotes(
  repo: string
): Promise<Map<string, GitHubRepo>> {
  const remotes = await getRemotes(repo);
  return mapFromEntries(
    Array.from(remotes.entries()).flatMap(([name, url]) => {
      const urlParsed = parseGitHubRemote(url);
      return urlParsed !== undefined ? [[name, urlParsed]] : [];
    })
  );
}

export function parseGitHubRemote(url: string): GitHubRepo | undefined {
  const sshMatch = url.match(/git@github.com:(.*)\/(.*).git/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const httpsMatch = url.match(/https:\/\/github.com\/(.*)\/(.*).git/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return undefined;
}

export async function isFileTracked(
  repo: string,
  filename: string
): Promise<boolean> {
  try {
    const { status } = child_process.spawnSync(
      "git",
      ["ls-files", "--error-unmatch", filename],
      { cwd: repo }
    );
    return status === 0;
  } catch (e) {
    return false;
  }
}

export async function blame(
  repo: string,
  file: string,
  contents: string,
  line: number | undefined
) {
  // See https://git-scm.com/docs/git-blame#_incremental_output
  // Note that git 1-indexes lines but VSCode 0-indexes lines.

  console.log(`git blame ${file}`);
  console.log(`git blame: contents size ${Buffer.byteLength(contents)} bytes`);

  let args = ["blame", "--incremental", "--contents=-"];
  if (line !== undefined) {
    args.push(`-L ${line},${line}`);
  }
  args.push(file);

  let t0: bigint;
  let elapsedMs: bigint;

  t0 = process.hrtime.bigint();
  const { status, stdout } = child_process.spawnSync("git", args, {
    cwd: repo,
    input: contents,
  });
  elapsedMs = (process.hrtime.bigint() - t0) / 1000000n;
  console.log(`git blame: blaming took ${elapsedMs} ms`);
  assert(status === 0, "git blame returned non-zero exit code");

  type BlameCommit = {
    author?: string;
    authorMail?: string;
    authorTime?: number;
    authorTz?: string;
    committer?: string;
    committerMail?: string;
    committerTime?: number;
    committerTz?: string;
    summary?: string;
    previous?: string;
  };
  type BlameHunk = {
    origCommitHash: string;
    filepath: string;
    origStartLine: number;
    currStartLine: number;
    hunksize: number;
  };

  t0 = process.hrtime.bigint();
  const lines = stdout
    .toString("utf-8")
    .split("\n")
    .filter((line) => line.length > 0);
  assert(lines.length > 0, "git blame should return at least one line");

  const commits = new DefaultMap<string, BlameCommit>(() => ({}));
  let blamehunks: BlameHunk[] = [];
  let ix = 0;
  while (ix < lines.length) {
    const header = lines[ix];
    const [origCommitHash, origStartLine, currStartLine, hunksize] =
      header.split(" ");
    assert(origCommitHash.length === 40, "expected a 40-character hash");
    const commit = commits.get(origCommitHash);

    ix++;
    while (!lines[ix].startsWith("filename ")) {
      // See https://stackoverflow.com/questions/39184819/javascript-split-a-string-in-4-pieces-and-leave-the-rest-as-one-big-piece
      const [key, ...valuebits] = lines[ix].split(" ");
      const value = valuebits.join(" ");
      switch (key) {
        case "author":
          commit.author = value;
          break;
        case "author-mail":
          commit.authorMail = value;
          break;
        case "author-time":
          commit.authorTime = parseInt(value);
          break;
        case "author-tz":
          commit.authorTz = value;
          break;
        case "committer":
          commit.committer = value;
          break;
        case "committer-mail":
          commit.committerMail = value;
          break;
        case "committer-time":
          commit.committerTime = parseInt(value);
          break;
        case "committer-tz":
          commit.committerTz = value;
          break;
        case "summary":
          commit.summary = value;
          break;
        case "previous":
          commit.previous = value;
          break;
        case "boundary":
          // Note: wtf is this?
          break;
        default:
          throw new Error(`unexpected key ${key}`);
      }
      ix++;
    }

    // We must be on the "filename ..." line since we broke out of the while loop.
    const filepath = lines[ix].split(" ", 2)[1];
    blamehunks.push({
      origCommitHash,
      filepath,
      origStartLine: parseInt(origStartLine),
      currStartLine: parseInt(currStartLine),
      hunksize: parseInt(hunksize),
    });

    ix++;
  }
  elapsedMs = (process.hrtime.bigint() - t0) / 1000000n;
  console.log(`git blame: parsing output took ${elapsedMs} ms`);

  return { commits, blamehunks };
}
