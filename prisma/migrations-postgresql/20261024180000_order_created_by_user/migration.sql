-- Atribui o pedido de mesa ao funcionário ou administrador autenticado.
-- Pedidos online e pedidos antigos permanecem sem atribuição.
ALTER TABLE "orders" ADD COLUMN "user_id" TEXT;

ALTER TABLE "orders"
ADD CONSTRAINT "orders_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");
