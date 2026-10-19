-- CreateTable
CREATE TABLE "product_additions" (
    "product_id" TEXT NOT NULL,
    "addition_id" TEXT NOT NULL,

    PRIMARY KEY ("product_id", "addition_id"),
    CONSTRAINT "product_additions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_additions_addition_id_fkey" FOREIGN KEY ("addition_id") REFERENCES "additions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "product_additions_addition_id_idx" ON "product_additions"("addition_id");
