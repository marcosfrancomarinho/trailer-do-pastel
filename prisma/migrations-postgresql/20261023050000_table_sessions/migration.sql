CREATE TABLE "table_sessions" (
  "id" TEXT NOT NULL,
  "table_id" TEXT NOT NULL,
  "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closed_at" TIMESTAMP(3),
  "closed_total" DECIMAL(65,30),
  CONSTRAINT "table_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "table_sessions_table_id_opened_at_idx" ON "table_sessions"("table_id", "opened_at");
CREATE UNIQUE INDEX "table_sessions_one_open_per_table_idx" ON "table_sessions"("table_id") WHERE "closed_at" IS NULL;

ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_table_id_fkey"
  FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "orders" ADD COLUMN "table_session_id" TEXT;
CREATE INDEX "orders_table_session_id_idx" ON "orders"("table_session_id");

-- Os pedidos anteriores não identificam a ocupação original. Agrupamos os de
-- cada mesa em uma comanda legada para preservar a consulta após a migração.
INSERT INTO "table_sessions" ("id", "table_id", "opened_at", "closed_at")
SELECT 'legacy-' || t."id", t."id",
  COALESCE((SELECT MIN(o."created_at") FROM "orders" o WHERE o."table_id" = t."id"), t."created_at"),
  CASE WHEN t."status" = 'FREE' THEN CURRENT_TIMESTAMP ELSE NULL END
FROM "tables" t
WHERE t."status" = 'OCCUPIED' OR EXISTS (SELECT 1 FROM "orders" o WHERE o."table_id" = t."id");

UPDATE "orders" o SET "table_session_id" = s."id"
FROM "table_sessions" s WHERE o."table_id" = s."table_id";

ALTER TABLE "orders" ADD CONSTRAINT "orders_table_session_id_fkey"
  FOREIGN KEY ("table_session_id") REFERENCES "table_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
