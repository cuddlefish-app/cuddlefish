import * as vscode from "vscode";
import { Credentials, getOctokitModal } from "./credentials";

const fs = vscode.workspace.fs;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function directoryExists(path: vscode.Uri): Promise<boolean> {
  try {
    const stat = await fs.stat(path);
    return stat.type === vscode.FileType.Directory;
  } catch (e) {
    if (e instanceof vscode.FileSystemError) {
      if (e.code === "FileNotFound" || e.code === "FileNotADirectory") {
        return false;
      } else {
        console.log(
          `fs.stat returned a FileSystemError with an unexpected code: ${e.code}`
        );
        throw e;
      }
    } else {
      console.error(e);
      throw e;
    }
  }
}

let knownGitRepos: { [key: string]: string } = {};

// Find the root directory containing a .git directory if one exists. Otherwise,
// return undefined.
async function gitRepoPath(path: vscode.Uri): Promise<string | undefined> {
  assert(path.scheme === "file", "path must be a file:// URI");

  if (path.path in knownGitRepos) {
    return knownGitRepos[path.path];
  }

  if (path.path === "/") {
    return undefined;
  } else {
    const res = (await directoryExists(vscode.Uri.joinPath(path, ".git")))
      ? path.path
      : await gitRepoPath(vscode.Uri.joinPath(path, ".."));
    if (res !== undefined) {
      knownGitRepos[path.path] = res;
    }
    return res;
  }
}

// function sleep(ms: number): Promise<void> {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

export async function activate(context: vscode.ExtensionContext) {
  console.log("Activating Cuddlefish Comments...");

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
      async () => {
        console.log(vscode.workspace.textDocuments.map((doc) => doc.fileName));
        let foo = vscode.workspace.textDocuments[0];

        const octokit = await getOctokitModal(credentials);
        const userInfo = await octokit.users.getAuthenticated();

        // console.log(userInfo);

        vscode.window.showInformationMessage(
          `Logged into GitHub as ${userInfo.data.login}`
        );
      }
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

  // TODO when files are opened:
  // - find if it's a git repo with a github remote
  // - if so, calculate blamelines
  // - subscribe to hasura for updates

  // TODO: figure out how to do subscriptions when a file is opened and update
  // the comment threads accordingly.
  // * https://github.com/nodegit/nodegit

  // comment controller
  let commentController = vscode.comments.createCommentController(
    "cuddlefish-comments",
    "Where does this even go?"
  );
  commentController.commentingRangeProvider = {
    provideCommentingRanges: async (
      document: vscode.TextDocument,
      _token: vscode.CancellationToken
    ) => {
      console.log("provideCommentingRanges");
      console.log(document.uri);

      // If it's not a local file, we can't comment on it. This also covers the
      // untitled file case which has scheme `untitled`.
      if (document.uri.scheme !== "file") {
        return [];
      }

      const repoRoot = await gitRepoPath(document.uri);
      if (repoRoot === undefined) {
        console.log(`could find a parent git repo for ${document.uri}`);
        return [];
      } else {
        // allow commenting anywhere in the document
        // TODO: should only allow commenting on lines that have valid blame info
        return [new vscode.Range(0, 0, document.lineCount - 1, 0)];
      }
    },
  };
  context.subscriptions.push(commentController);

  // Starting a new thread
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.startThread",
      async (reply: vscode.CommentReply) => {
        console.log("Starting a new thread");
        console.log(reply);

        const gitRepoRoot = await gitRepoPath(reply.thread.uri);
        // We should only be showing the comment gutters if we're in a file
        // that's in a git repo.
        if (gitRepoRoot === undefined) {
          throw new Error(
            "tried to startThread in a file that does not seems to be in a git repo"
          );
        }

        // TODO: check if there is a git remote that is github and is public.
        // See https://www.nodegit.org/api/blame/#buffer

        // TODO: currently blocked installing nodegit: https://github.com/nodegit/nodegit/issues/1840

        gitRepoRoot;
        // TODO get name from session/user info
        // TODO add profile photo
        // TODO actually hit backend...
        reply.thread.comments = [
          {
            author: { name: "Samuel Ainsworth" },
            body: reply.text,
            mode: vscode.CommentMode.Preview,
          },
        ];
      }
    )
  );

  // Comment on existing thread
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.commentOnThread",
      (reply: vscode.CommentReply) => {
        // TODO
        console.group("commentOnThread");
        console.log(reply);
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
