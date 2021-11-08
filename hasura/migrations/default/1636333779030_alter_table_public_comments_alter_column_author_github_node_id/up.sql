alter table "public"."comments" alter column "author_github_node_id" drop not null;
comment on column "public"."comments"."author_github_node_id" is E'The GitHub node id of the user who authored this comment. May be null when author_email is instead present.';
