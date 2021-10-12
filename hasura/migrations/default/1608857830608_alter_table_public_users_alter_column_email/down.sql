COMMENT ON COLUMN "public"."users"."email" IS E'';
alter table "public"."users" rename column "github_email" to "email";
