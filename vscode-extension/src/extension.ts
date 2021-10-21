// TODO:
// - [ ] git blame, and only show comment ranges where it's relevant

import * as child_process from "child_process";
import * as util from "util";
import * as vscode from "vscode";
import { Credentials, getOctokitModal } from "./credentials";
import * as git from "./git";

const exec = util.promisify(child_process.exec);
// const fs = vscode.workspace.fs;

function logErrors0<T>(f: () => Promise<T>): () => Promise<T> {
  return async () => {
    try {
      return await f();
    } catch (e) {
      console.error(e);
      vscode.window.showErrorMessage(
        "Cuddlefish Comments experienced an error. Check the extension logs for more info!"
      );

      // This bit is kind of an ugly hack to make this wrapper easy to use.
      // Often we need to pass things wrapped with this to other code than
      // expects callbacks returning just Promise<T>.
      return undefined as any;
    }
  };
}
function logErrors1<A1, T>(f: (x1: A1) => Promise<T>): (x1: A1) => Promise<T> {
  return async (x1: A1) => {
    try {
      return await f(x1);
    } catch (e) {
      console.error(e);
      vscode.window.showErrorMessage(
        "Cuddlefish Comments experienced an error. Check the extension logs for more info!"
      );
      return undefined as any;
    }
  };
}
function logErrors2<A1, A2, T>(
  f: (x1: A1, x2: A2) => Promise<T>
): (x1: A1, x2: A2) => Promise<T> {
  return async (x1: A1, x2: A2) => {
    try {
      return await f(x1, x2);
    } catch (e) {
      console.error(e);
      vscode.window.showErrorMessage(
        "Cuddlefish Comments experienced an error. Check the extension logs for more info!"
      );
      return undefined as any;
    }
  };
}

// TODO move git stuff into a separate file

// function sleep(ms: number): Promise<void> {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

export async function activate(context: vscode.ExtensionContext) {
  console.log("Activating Cuddlefish Comments...");

  // Check that we have a working git installation.
  try {
    const { stdout } = await exec("git --version");
    console.log(`git version: ${stdout}`);
  } catch (e) {
    vscode.window.showErrorMessage(
      "Could not find a working git installation. Do you have git installed and in your PATH?"
    );
    console.error(e);
  }

  const credentials = new Credentials(context);

  // context.subscriptions.push(
  //   vscode.workspace.onDidOpenTextDocument((editor) => {
  //     console.log("document opened");
  //     console.log(editor);
  //   })
  // );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.helloWorld",
      logErrors0(async () => {
        // console.log(vscode.workspace.textDocuments.map((doc) => doc.fileName));
        // let foo = vscode.workspace.textDocuments[0];

        const octokit = await getOctokitModal(credentials);
        const userInfo = await octokit.users.getAuthenticated();

        vscode.window.showInformationMessage(
          `Logged into GitHub as ${userInfo.data.login}`
        );
      })
    )
  );

  // Status bar
  let statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  statusBar.command = "cuddlefish-comments.helloWorld";
  statusBar.text = "$(comment-discussion) CF Comments";
  context.subscriptions.push(statusBar);
  statusBar.show();

  // comment controller
  let commentController = vscode.comments.createCommentController(
    "cuddlefish-comments",
    "Where does this even go?"
  );
  commentController.commentingRangeProvider = {
    provideCommentingRanges: logErrors2(
      async (
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
      ) => {
        // This gets called every single time a file is opened, even though the
        // comment threads on the file are cached by VSCode.

        // TODO when files are opened:
        // - [x] find if it's a git repo with a github remote
        // - [ ] if so, calculate blamelines
        // - [ ] subscribe to hasura for updates

        // TODO: figure out how to do subscriptions when a file is opened and update
        // the comment threads accordingly.

        // If it's not a local file, we can't comment on it. This also covers the
        // untitled file case which has scheme `untitled`.
        if (document.uri.scheme !== "file") {
          return [];
        }

        const repo = await git.repoRoot(document.uri);
        if (repo === undefined) {
          console.log(`Could not find a parent git repo for ${document.uri}`);
          return [];
        } else {
          // Note we don't check whether repos are public or private here.
          // That's handled when someone goes to start a new thread.

          const githubRemotes = Array.from(
            (await git.getRemotes(repo)).values(),
            git.parseGitHubRemote
          ).filter((remote) => remote !== undefined);

          if (githubRemotes.length > 0) {
            // TODO: should only allow commenting on lines that have valid blame info

            const blameinfo = await git.blame(
              repo,
              document.fileName,
              document.isDirty ? document.getText() : undefined,
              undefined
            );
            console.log(blameinfo);
            // TODO glue this together
            return [new vscode.Range(0, 0, document.lineCount - 1, 0)];
          } else {
            return [];
          }
        }

        // TODO: support adding comments on library code that is not necessarily
        // in a git repo, but is in node_modules, python site-packages, etc.
      }
    ),
  };
  context.subscriptions.push(commentController);

  // Starting a new thread
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.startThread",
      logErrors1(async (reply: vscode.CommentReply) => {
        console.log("Starting a new thread");
        console.log(reply);

        const gitRepoRoot = await git.repoRoot(reply.thread.uri);
        // We should only be showing the comment gutters if we're in a file
        // that's in a git repo.
        if (gitRepoRoot === undefined) {
          throw new Error(
            "tried to startThread in a file that does not seems to be in a git repo"
          );
        }

        // TODO:
        //  - [ ] check if there is a git remote that is github and is public.
        //    - [ ] calculate blame info for the file on that line with -L option
        //  - [ ] get name from session/user info
        //  - [ ] add profile photo
        //  - [ ] actually hit backend...
        reply.thread.comments = [
          {
            author: { name: "Samuel Ainsworth" },
            body: reply.text,
            mode: vscode.CommentMode.Preview,
          },
        ];
      })
    )
  );

  // Comment on existing thread
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.commentOnThread",
      logErrors1(async (reply: vscode.CommentReply) => {
        // TODO
        console.group("commentOnThread");
        console.log(reply);
      })
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
