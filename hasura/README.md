# Hasura and Postgres

Public access is available and is given the role `anonymous`.

## Schema

### Threads

The `threads` table stores all the threads. It should be unique on `(commit, file, linenumber)` when `resolved == false`.

TODO: actually apply that constraint with a partial unique index: https://stackoverflow.com/questions/16236365/postgresql-conditionally-unique-constraint.

## Pushing

When a new Hasura version is released:

- Update the Dockerfile
- `make push-and-release`

## Troubleshooting

If you get an error like

```
=== Pushing web (/Users/skainswo/dev/nuvemfs/hasura/Dockerfile)
The push refers to repository [registry.heroku.com/nuvemfs-hasura/web]
1ad65d6e8e63: Preparing
unauthorized: authentication required
 ▸    Error: docker push exited with Error: 1
make: *** [push] Error 1
```

make sure to run

```
heroku container:login
```
