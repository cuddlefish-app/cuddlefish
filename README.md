# cuddlefish

As much as possible we try to 1-index line number in the backend and hasura. VSCode OTOH uses 0-indexed line numbers.

## Dev port mapping

- 3000: CRA web frontend (legacy?)
- 3001: rust api
- 3002: next.js
- 5432: postgres
- 8080: hasura
- 9695: hasura console

## TODO:

- add optional message to notNull (maybe do some sweet.js metaprogramming?)

- Launch

  - set up render next.js
    - set up health check
  - point sendgrid parse to prod
  - push vscode extension to the marketplace
    - fix hardcoded dev urls (how to know when in dev?)
  - set up log alerting

- VSCode extension

  - disallow commenting on empty lines
  - disallow commenting on lines from commits that are not pushed yet. See https://stackoverflow.com/questions/2016901/viewing-unpushed-git-commits.
  - speed up comment creation (seems like we are hitting github's auth endpoint every time?)
  - Link in email that opens up straight to extension on the right file/line!
  - subscribe for updates
  - Use the reply `label` attribute to show "code author", "code committer", etc.

- API

  - check that insert_comments_webhook is receiving requests from hasura with `API_SECRET`

- Hasura

  - Update description of the comments table, now that the TODO should be done there
  - hasura console on doodoo doesn't work (https://github.com/hasura/graphql-engine/issues/4926 and https://github.com/hasura/graphql-engine/discussions/7789)

- Sending email

  - include code snippet syntax highlighting? (shiki? how is the line highlighting with hover accomplished here: https://fatihkalifa.com/typescript-twoslash)
  - markdown syntax highlighting? (see https://github.com/antfu/markdown-it-shiki)

- receive email

  - lookup email address in hasura before github

- email notifications for new user signups
- write an AddComment mutation, disallow empty comments
- Comment reactions
- disallow empty comments in startthread
- Migrate away from rust api
  - migrate hasura_auth_webhook to next.js
  - migrate startthread to next.js
- switch to mailgun
- set up test suite (jest?)
  - test github functions

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
