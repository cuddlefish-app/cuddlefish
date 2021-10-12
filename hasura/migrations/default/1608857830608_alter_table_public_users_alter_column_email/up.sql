COMMENT ON COLUMN "public"."users"."email" IS E'This is the email according to the user\'s GitHub account.';
alter table "public"."users" rename column "email" to "github_email";
