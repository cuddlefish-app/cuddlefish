alter table "public"."github_users" alter column "access_token" drop not null;
comment on column "public"."github_users"."access_token" is E'Can be null if a user emails us, but doesn\'t login via OAuth.';
