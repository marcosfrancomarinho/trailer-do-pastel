-- Otimiza as consultas do painel filtradas por status e dia de criação.
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");
