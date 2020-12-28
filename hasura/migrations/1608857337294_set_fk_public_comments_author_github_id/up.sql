alter table "public"."comments"
           add constraint "comments_author_github_id_fkey"
           foreign key ("author_github_id")
           references "public"."users"
           ("github_id") on update restrict on delete restrict;
