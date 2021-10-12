CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."user_sessions"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "user_github_id" integer NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("user_github_id") REFERENCES "public"."users"("github_id") ON UPDATE restrict ON DELETE restrict);
