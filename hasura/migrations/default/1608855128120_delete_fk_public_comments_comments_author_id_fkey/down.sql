alter table "public"."comments" add foreign key ("author_id") references "public"."users"("id") on update restrict on delete restrict;
