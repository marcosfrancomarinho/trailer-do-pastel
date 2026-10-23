-- A etapa READY passa a significar pedido concluído.
UPDATE "orders" SET "status" = 'COMPLETED' WHERE "status" = 'READY';
UPDATE "order_status_history" SET "status" = 'COMPLETED' WHERE "status" = 'READY';
