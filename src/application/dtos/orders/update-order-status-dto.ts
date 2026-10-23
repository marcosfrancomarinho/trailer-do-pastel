import type { OrderStatusValue } from '../../../domain/value-objects/order/order-status.js';

export interface UpdateOrderStatusInput {
  status: string;
  orderId: string;
}

export interface UpdateOrderStatusOutput {
  status: OrderStatusValue;
  id: string;
}
