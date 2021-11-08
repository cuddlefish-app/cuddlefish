comment on column "public"."comments"."author_github_node_id" is E'The GitHub node id of the user who authored this comment.';
alter table "public"."comments" alter column "author_github_node_id" set not null;
