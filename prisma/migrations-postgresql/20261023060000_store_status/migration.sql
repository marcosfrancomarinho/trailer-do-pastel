CREATE TYPE "StoreStatus" AS ENUM ('OPEN', 'CLOSED');

CREATE TABLE "store" (
  "id" INTEGER NOT NULL,
  "status" "StoreStatus" NOT NULL DEFAULT 'OPEN',
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "store_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "store_singleton_id_check" CHECK ("id" = 1)
);

-- Preserva o recebimento de pedidos até o funcionário fechar a loja.
INSERT INTO "store" ("id", "status") VALUES (1, 'OPEN');
