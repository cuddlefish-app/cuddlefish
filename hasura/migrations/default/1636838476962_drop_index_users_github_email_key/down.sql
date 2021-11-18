CREATE  INDEX "users_github_email_key" on
  "public"."github_users" using btree ("email");
