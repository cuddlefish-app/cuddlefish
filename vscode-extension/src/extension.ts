import { Mutex } from "async-mutex";
import * as child_process from "child_process";
import * as util from "util";
import * as vscode from "vscode";
import { CommentJefe } from "./comments";
import {
  eraseCuddlefishSessionToken,
  getCuddlefishSessionTokenModal,
  getOctokitUserInfo,
  GitHubCredentials,
  hasuraEndpoint,
} from "./credentials";
import * as git from "./git";
import {
  assert,
  assertNotNull,
  logErrors0,
  logErrors1,
  logErrors2,
  notNull,
} from "./utils";

const exec = util.promisify(child_process.exec);

// An ugly hack to work around https://github.com/microsoft/vscode/issues/135712
// Using vscode.Uri's as keys doesn't work, so we use `uri.toString()` instead.
const uriToDocument = new Map<string, vscode.TextDocument>();

function filterOutEmptyLines(
  document: vscode.TextDocument,
  ranges: Array<[number, number]>
): Array<[number, number]> {
  // Incoming ranges are inclusive on both ends and 0-indexed. `emptyLines` also
  // contains 0-indexed line numbers, so it works out.
  const emptyLines = new Set<number>();
  for (const [ix, line] of document.getText().split(/\r?\n/).entries()) {
    if (line.trim() === "") {
      emptyLines.add(ix);
    }
  }

  const ret = new Array<[number, number]>();
  for (const [start, end] of ranges) {
    let currentIntervalStart = null;
    for (let i = start; i <= end; i++) {
      if (emptyLines.has(i)) {
        // i is an empty line, so if we've just completed an interval, add that
        // to `ret`.
        if (currentIntervalStart !== null) {
          // Intervals are inclusive on both ends!
          ret.push([currentIntervalStart, i - 1]);
          currentIntervalStart = null;
        }
      } else {
        // i is not an empty line, so if we haven't started an interval, start
        // one. Otherwise, keep extending the current interval.
        if (currentIntervalStart === null) {
          currentIntervalStart = i;
        }
      }
    }
    // If we haven't finished the last interval, add it to `ret`.
    if (currentIntervalStart !== null) {
      ret.push([currentIntervalStart, end]);
    }
  }
  return ret;
}

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

        // Unfortunately, we're stuck with some mutation here. We don't need the
        // session token itself here, but we do need to login the user and store
        // that token in globalStorage which happens inside of
        // `getCuddlefishSessionTokenModal`.
        await getCuddlefishSessionTokenModal(context, credentials);

        const userInfo = await getOctokitUserInfo(credentials);
        vscode.window.showInformationMessage(
          `Logged in to Cuddlefish Comments via GitHub as @${userInfo.data.login}!`
        );
      })
    )
  );

  // The enablement on this should specify that it's only in dev mode.
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.logout",
      logErrors0(async () => {
        eraseCuddlefishSessionToken(context);
        vscode.window.showInformationMessage("Logged out");
      })
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.hasuraEndpoint",
      logErrors0(async () => {
        vscode.window.showInformationMessage(hasuraEndpoint());
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

  // Due to some weird VSCode bug, we need to make sure that we only ever
  // `provideCommentingRanges` one at a time. Otherwise, it's possible for it to
  // be called twice in short succession, and the second call will empty out all
  // of the threads that were loaded by the first call. Why this happens is
  // beyond me.
  //
  // Moving the mutex to only run `trackDocument` exclusively doesn't seem to
  // solve it either.
  // TODO figure out what exactly is going wrong here. Perhaps it has something
  // to do with `uriToDocument`?
  const mutex = new Mutex();
  commentController.commentingRangeProvider = {
    provideCommentingRanges: logErrors2(
      async (document: vscode.TextDocument, _token: vscode.CancellationToken) =>
        await mutex.runExclusive(async () => {
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
          if (blameinfo === null) {
            // It's possible the git blame to return null in case we hit the
            // timeout, etc. In that case we just don't support commenting on
            // the file.
            return [];
          }

          // Load the existing comments and subscribe to updates.
          await commentJefe.trackDocument(document.uri, blameinfo.blamehunks);

          // TODO also check that we don't allow commenting on commits that haven't been pushed yet. See https://stackoverflow.com/questions/2016901/viewing-unpushed-git-commits
          // TODO how to identify remote name and remote branch for the current branch?
          // git log origin/main..HEAD --format=format:"%H"
          // See https://stackoverflow.com/questions/171550/find-out-which-remote-branch-a-local-branch-is-tracking
          // git rev-parse --abbrev-ref --symbolic-full-name @{u}

          // Subtract one to account for the fact that VSCode is 0-indexed.
          // Subtract another one from the end of the interval to account for
          // the fact that hunksize 1 implies the range [17, 17], not [17, 18].
          // Ranges are inclusive on both ends.
          const ranges: Array<[number, number]> = blameinfo.blamehunks
            .filter((hunk) => hunk.origCommitHash !== git.ZERO_HASH)
            .map(({ currStartLine, hunksize }) => [
              currStartLine - 1,
              currStartLine + hunksize - 2,
            ]);

          // TODO unclear from the docs if Range is inclusive or exclusive.
          // Either way this seems to do the right thing for now.
          return filterOutEmptyLines(document, ranges).map(
            ([a, b]) => new vscode.Range(a, 0, b, 0)
          );
        })
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
          (await git.getGitHubRemotes(gitRepoRoot)).values()
        );
        const document = notNull(
          uriToDocument.get(reply.thread.uri.toString())
        );

        const currLineNumber = reply.thread.range.start.line + 1;
        const blame = await git.blame(
          gitRepoRoot,
          reply.thread.uri.path,
          document.getText(),
          currLineNumber
        );
        assertNotNull(
          blame,
          "git blame timed out or returned null for some other reason while starting a new thread"
        );
        assert(blame.blamehunks.length === 1, "expected exactly on blamehunk");
        const blamehunk = blame.blamehunks[0];
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
