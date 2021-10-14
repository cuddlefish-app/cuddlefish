"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOctokitModal = exports.Credentials = void 0;
const Octokit = require("@octokit/rest");
const vscode = require("vscode");
const GITHUB_AUTH_PROVIDER_ID = "github";
// The GitHub Authentication Provider accepts the scopes described here:
// https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/
const SCOPES = ["user:email"];
class Credentials {
    constructor(context) {
        // Sessions are changed when a user logs in or logs out.
        context.subscriptions.push(vscode.authentication.onDidChangeSessions(async (e) => {
            if (e.provider.id === GITHUB_AUTH_PROVIDER_ID) {
                await this.getSessionQuiet();
            }
        }));
        // This isn't await'd. Should it be?
        this.getSessionQuiet();
    }
    async getSessionQuiet() {
        /**
         * By passing the `createIfNone` flag, a numbered badge will show up on the accounts activity bar icon.
         * An entry for the sample extension will be added under the menu to sign in. This allows quietly
         * prompting the user to sign in.
         * */
        this.session = await vscode.authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, { createIfNone: false });
        return this.session;
    }
    async getSessionModal() {
        /**
         * When the `createIfNone` flag is passed, a modal dialog will be shown asking the user to sign in.
         * Note that this can throw if the user clicks cancel.
         */
        this.session = await vscode.authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, { createIfNone: true });
        if (this.session === undefined) {
            vscode.window.showInformationMessage("Could not get GitHub credentials.");
        }
        return this.session;
    }
}
exports.Credentials = Credentials;
async function getOctokitModal(creds) {
    const session = await creds.getSessionModal();
    if (session === undefined) {
        throw new Error("Could not get GitHub credentials.");
    }
    return new Octokit.Octokit({ auth: session.accessToken });
}
exports.getOctokitModal = getOctokitModal;
//# sourceMappingURL=credentials.js.map