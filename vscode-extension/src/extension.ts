// TODO
// - email notifications
// - send feedback
// - subscribing to thread updates (on file close, unsubscribe)
// - open line in github
// - email link -> open vscode -> show readonly file with comment thread
// - reactions
// - private repo -> interest form
// - show "code author", "contributor", etc labels to comments.
// - lowprio: what's up with that collapse button?
// - lowprio: auto link @-links

import * as child_process from "child_process";
import * as util from "util";
import * as vscode from "vscode";
import { CommentJefe } from "./comments";
import {
  eraseCuddlefishSessionToken,
  getCuddlefishSessionTokenModal,
  getOctokitModal,
  GitHubCredentials,
} from "./credentials";
import * as git from "./git";
import { assert, logErrors0, logErrors1, logErrors2, notNull } from "./utils";

const exec = util.promisify(child_process.exec);

// An ugly hack to work around https://github.com/microsoft/vscode/issues/135712
// Using vscode.Uri's as keys doesn't work, so we use `uri.toString()` instead.
const uriToDocument = new Map<string, vscode.TextDocument>();

// Check whether or not to allow commenting on a given document. Returns the
// repo root if commenting is allowed, and undefined if not.
async function isCommentingAllowed(
  document: vscode.TextDocument
): Promise<string | undefined> {
  // TODO: support adding comments on library code that is not necessarily in a
  // git repo, but is in node_modules, python site-packages, etc.

  // If it's not a local file, we can't comment on it. This also covers
  // the untitled file case which has scheme `untitled`.
  if (document.uri.scheme !== "file") {
    return undefined;
  }

  const repo = await git.repoRoot(document.uri);
  if (repo === undefined) {
    console.log(`Could not find a parent git repo for ${document.uri}`);
    return undefined;
  }

  // Note we don't check whether repos are public or private here. That's
  // handled when someone goes to start a new thread.

  // Note at some point we might as well remove this... it adds latency
  // and complicates the flow for getting people to use cuddlefish on
  // non-GitHub repos (eventually...).
  const githubRemotes = await git.getGitHubRemotes(repo);
  if (githubRemotes.size === 0) {
    // None of the remotes are GitHub remotes. Don't show any commenting
    // ranges for now.
    return undefined;
  }

  // Check if the file is tracked by git. If not, we should not allow
  // commenting.
  if (!(await git.isFileTracked(repo, document.uri.path))) {
    return undefined;
  }

  return repo;
}

export async function activate(context: vscode.ExtensionContext) {
  console.log("Activating Cuddlefish Comments...");

  // Check that we have a working git installation.
  try {
    // TODO don't use exec here, prefer spawn.
    const { stdout } = await exec("git --version");
    console.log(`git version: ${stdout}`);
  } catch (e) {
    vscode.window.showErrorMessage(
      "Could not find a working git installation. Do you have git installed and in your PATH?"
    );
    console.error(e);
  }

  const credentials = new GitHubCredentials(context);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.login",
      logErrors0(async () => {
        // Scrap our current cuddlefish session token and get a new one.
        eraseCuddlefishSessionToken(context);
        await getCuddlefishSessionTokenModal(context, credentials);

        const octokit = await getOctokitModal(credentials);
        const userInfo = await octokit.users.getAuthenticated();
        vscode.window.showInformationMessage(
          `Logged in to Cuddlefish Comments via GitHub as @${userInfo.data.login}!`
        );
      })
    )
  );

  // Status bar
  let statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  statusBar.command = "cuddlefish-comments.login";
  statusBar.text = "$(comment-discussion) Cuddlefish";
  context.subscriptions.push(statusBar);
  statusBar.show();

  // Comment controller. The description shows up when there are multiple
  // comment providers for the same line and you have to choose between them.
  // See https://postimg.cc/WhntTs50.
  const commentController = vscode.comments.createCommentController(
    "cuddlefish-comments",
    "Cuddlefish Comments"
  );
  const commentJefe = new CommentJefe(context, credentials, commentController);
  commentController.options = { placeHolder: "What's on your mind?" };
  commentController.commentingRangeProvider = {
    provideCommentingRanges: logErrors2(
      async (
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
      ) => {
        // This gets called every single time a file is opened, even though the
        // comment threads on the file are cached by VSCode.
        console.log("provideCommentingRanges");

        const repo = await isCommentingAllowed(document);
        if (repo === undefined) {
          return [];
        }

        uriToDocument.set(document.uri.toString(), document);

        const blameinfo = await git.blame(
          repo,
          document.fileName,
          document.getText(),
          undefined
        );

        // Load the existing comments and subscribe to updates.
        await commentJefe.trackDocument(document.uri, blameinfo.blamehunks);

        // Subtract one to account for the fact that VSCode is 0-indexed.
        // Subtract another one to account for the fact that hunksize 1
        // implies the range [17, 17], not [17, 18].
        const ranges = blameinfo.blamehunks
          .filter((hunk) => hunk.origCommitHash !== git.ZERO_HASH)
          .map(({ currStartLine, hunksize }) => [
            currStartLine - 1,
            currStartLine + hunksize - 2,
          ]);

        // TODO unclear from the docs if Range is inclusive or exclusive.
        // Either way this seems to do the right thing for now.
        return ranges.map(([a, b]) => new vscode.Range(a, 0, b, 0));
      }
    ),
  };
  context.subscriptions.push(commentController);

  // Starting a new thread
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.startThread",
      logErrors1(async (reply: vscode.CommentReply) => {
        // We should only be showing the comment gutters if we're in a file
        // that's in a git repo.
        const gitRepoRoot = notNull(await git.repoRoot(reply.thread.uri));
        const githubRemotes = Array.from(
          (await git.getGitHubRemotes(gitRepoRoot)).values(),
          git.repoId
        );
        const document = notNull(
          uriToDocument.get(reply.thread.uri.toString())
        );

        const currLineNumber = reply.thread.range.start.line + 1;
        const { blamehunks } = await git.blame(
          gitRepoRoot,
          reply.thread.uri.path,
          document.getText(),
          currLineNumber
        );
        assert(blamehunks.length === 1, "expected exactly on blamehunk");
        const blamehunk = blamehunks[0];
        assert(
          blamehunk.origCommitHash !== git.ZERO_HASH,
          "expected non-zero commit hash"
        );
        assert(blamehunk.currStartLine === currLineNumber, "wrong line");
        console.log(
          `staring a thread on original line ${JSON.stringify(blamehunk)}`
        );

        // Actually start the thread.
        await commentJefe.startThread(
          githubRemotes,
          blamehunk.origCommitHash,
          blamehunk.filepath,
          blamehunk.origStartLine,
          reply
        );
      })
    )
  );

  // Comment on existing thread
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.commentOnThread",
      logErrors1(async (reply: vscode.CommentReply) => {
        await commentJefe.addComment(reply);
      })
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("cuddlefish-comments.dispose", () => {
      commentController.dispose();
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
