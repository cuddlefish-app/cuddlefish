ALTER TABLE "public"."comments" ADD COLUMN "author_id" text;
ALTER TABLE "public"."comments" ALTER COLUMN "author_id" DROP NOT NULL;
