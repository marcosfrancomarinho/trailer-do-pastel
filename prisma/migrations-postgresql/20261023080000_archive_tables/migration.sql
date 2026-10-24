ALTER TABLE "tables" ADD COLUMN "deleted_at" TIMESTAMP(3);

DROP INDEX "tables_number_key";
CREATE UNIQUE INDEX "tables_active_number_key" ON "tables"("number") WHERE "deleted_at" IS NULL;
