-- CreateTable
CREATE TABLE "additions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "order_item_additions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_item_id" TEXT NOT NULL,
    "addition_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL NOT NULL,
    CONSTRAINT "order_item_additions_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_item_additions_addition_id_fkey" FOREIGN KEY ("addition_id") REFERENCES "additions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "order_item_additions_order_item_id_addition_id_key" ON "order_item_additions"("order_item_id", "addition_id");
