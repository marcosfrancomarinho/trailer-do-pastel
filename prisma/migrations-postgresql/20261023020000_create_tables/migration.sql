CREATE TYPE "TableStatus" AS ENUM ('FREE', 'OCCUPIED');

CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tables_number_key" ON "tables"("number");
