ALTER TABLE "orders" ADD COLUMN "table_id" TEXT;

CREATE INDEX "orders_table_id_idx" ON "orders"("table_id");

ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fkey"
  FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
