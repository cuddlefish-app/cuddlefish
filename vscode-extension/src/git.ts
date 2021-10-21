import * as child_process from "child_process";
import * as util from "util";
import * as vscode from "vscode";
import { assert, directoryExists } from "./utils";

const exec = util.promisify(child_process.exec);

// paths -> git repo root paths
// TODO use Map here instead of an object
let knownGitRepoRoots: { [key: string]: string } = {};

// Find the root directory containing a .git directory if one exists. Otherwise,
// return undefined.
export async function repoRoot(path: vscode.Uri): Promise<string | undefined> {
  assert(path.scheme === "file", "path must be a file:// URI");

  if (path.path in knownGitRepoRoots) {
    return knownGitRepoRoots[path.path];
  }

  if (path.path === "/") {
    return undefined;
  } else {
    const res = (await directoryExists(vscode.Uri.joinPath(path, ".git")))
      ? path.path
      : await repoRoot(vscode.Uri.joinPath(path, ".."));
    if (res !== undefined) {
      knownGitRepoRoots[path.path] = res;
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

export function parseGitHubRemote(url: string) {
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

export async function blame(
  repo: string,
  file: string,
  contents: string | undefined,
  line: number | undefined
) {
  // TODO
  // - [ ] should use --porcelain or --line-porcelain?
  // - [ ] write contents to tempfile

  let args = ["git", "blame", "--porcelain"];
  if (line !== undefined) {
    args.push(`-L ${line},${line}`);
  }
  if (contents !== undefined) {
    // TODO write contents to temp file
    const tempfile = "TODO";
    args.push(`--contents ${tempfile}`);
  }
  args.push(file);

  const { stdout } = await exec(args.join(" "), { cwd: repo });

  console.log(stdout);
  // const blame = stdout.split("\n");
  // const commit = blame[0].split(" ")[1];
  // const author = blame[1].split(" ")[2];
  // const date = blame[1].split(" ")[3];
  // return { commit, author, date };
}
