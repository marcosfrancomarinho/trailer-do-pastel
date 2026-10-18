-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total" DECIMAL NOT NULL,
    "tracking_token" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_orders" ("created_at", "customer_name", "customer_phone", "id", "status", "total", "tracking_token", "updated_at") SELECT "created_at", "customer_name", "customer_phone", "id", "status", "total", "tracking_token", "updated_at" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE UNIQUE INDEX "orders_tracking_token_key" ON "orders"("tracking_token");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
