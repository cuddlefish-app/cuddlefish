# cuddlefish

As much as possible we try to 1-index line number in the backend and hasura. VSCode OTOH uses 0-indexed line numbers.

## Dev port mapping

- 3000: CRA web frontend (legacy?)
- 3001: rust api
- 3002: next.js
- 8080: hasura
- 9695: hasura console

## TODO:

- Sending email

  - sending basic email for new thread

    - include code snippet syntax highlighting? (shiki? how is the line highlighting with hover accomplished here: https://fatihkalifa.com/typescript-twoslash)

    - markdown syntax highlighting? (see https://github.com/antfu/markdown-it-shiki)

  - sending basic email for new comment

    - figure out how to set message-id, recipients, in-reply-to

    - threading (https://stackoverflow.com/questions/35521459/send-email-as-reply-to-thread, https://github.com/sendgrid/sendgrid-nodejs/issues/690)

- receive email

  - use ngrok for easy development

  - [sendgrid parse setup](https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook#additional-resources)

  - parse email contents

  - check for signed requests coming from sendgrid

  - insert comment in the comments table

- launch

  - push vscode extension to the marketplace
    - fix hardcoded dev urls
  - set up render postgres, hasura
    - figure out how to do config as code
  - set up next.js/vercel
    - disable email, sendgrid, and github test routes

- set up test suite (jest?)

  - test github functions

- Link in email that opens up straight to extension on the right file/line!

- disallow commenting on empty lines
- comment reactions
- email notifications for new user signups
- subscribe for updates
- migrate startthread to next.js
- migrate hasura_auth_webhook to next.js
- write an AddComment mutation, disallow empty comments

Hasura issues (non-blockers):

- https://github.com/hasura/graphql-engine/issues/7676
- https://github.com/hasura/graphql-engine/issues/7728

## Backend engineering choices

### Rust

- Pro: performant
- Pro: sane, strong type system
- Con: graphql_client is not well supported, not always type safe (https://github.com/graphql-rust/graphql-client/issues/357, https://github.com/graphql-rust/graphql-client/issues/265, https://github.com/graphql-rust/graphql-client/issues/218, https://github.com/graphql-rust/graphql-client/issues/97)
- Con: no GC is a little annoying sometimes

### Typescript

- Pro: type system is impressively strong, yet flexible
- Pro: good library ecosystem
- Con: errors in `Promise`s can be silently lost
- Con: graphql type codegen is shockingly still not that great. Apollo's codegen doesn't seem to be very well supported these days. graphql-code-generator is not perfect either (https://github.com/dotansimha/graphql-code-generator/issues/6916).
