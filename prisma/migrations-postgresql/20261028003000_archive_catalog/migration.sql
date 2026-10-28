ALTER TABLE "categories" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "additions" ADD COLUMN "deleted_at" TIMESTAMP(3);
