# cuddlefish-comments README

- VSCode extensions do not really support native/gyp dependencies. See https://github.com/microsoft/vscode/issues/658. There are pure-JS git implementations but they will certainly be much slower with `git blame`s and may be buggy. Using nodegit would be ideal since it supports some caching between `git blame` calls but using nodegit is blocked on https://github.com/nodegit/nodegit/issues/1840. Currently we just invoke the `git` command directly and parse results in JS. This is easy and portable.

Notes:

- ApolloClient subscription from node.js: https://github.com/hasura/nodejs-graphql-subscriptions-boilerplate. Unsubscribing: https://stackoverflow.com/questions/51477002/unsubscribe-subscription-in-apollo-client

TODO:

- Get TS types for gql operations
- `startThread` enablement is currently `!commentIsEmpty && !activeEditorIsDirty`. It's not clear if activeEditorIsDirty will be correct when the user has two editors open: one has the comment and the other is dirty. See https://code.visualstudio.com/api/references/when-clause-contexts for more info. Can't find a better context.
- Upgrade nodegit dependency once 0.28.0 is released. See https://github.com/nodegit/nodegit/issues/1840 and https://github.com/nodegit/nodegit/issues/1864.
- add a feedback option!

Download the hasura schema definition with apollo:

```
"gql:download": "npx rover graph introspect http://localhost:8080/v1/graphql --header x-hasura-admin-secret:hasurasecret --header x-hasura-role:user > hasura-schema.gql",
```

Run `npm run gql:codegen -- --watch` to download the schema and generate TS types in development.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: enable/disable this extension
- `myExtension.thing`: set to `blah` to do something

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

**Note:** You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux)
- Toggle preview (`Shift+CMD+V` on macOS or `Shift+Ctrl+V` on Windows and Linux)
- Press `Ctrl+Space` (Windows, Linux) or `Cmd+Space` (macOS) to see a list of Markdown snippets

### For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
