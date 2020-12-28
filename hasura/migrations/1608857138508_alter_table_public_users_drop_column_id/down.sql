ALTER TABLE "public"."users" ADD COLUMN "id" text;
ALTER TABLE "public"."users" ALTER COLUMN "id" DROP NOT NULL;
