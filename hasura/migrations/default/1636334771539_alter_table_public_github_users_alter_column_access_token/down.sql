comment on column "public"."github_users"."access_token" is NULL;
alter table "public"."github_users" alter column "access_token" set not null;
