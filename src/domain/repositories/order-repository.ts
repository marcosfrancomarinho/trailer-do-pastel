import type { Order } from '../entities/order.js';
import type { OrderStatus } from '../value-objects/order/order-status.js';

export interface SavedOrder {
  id: string;
  trackingToken: string;
}

export interface OrderRepository {
  save(order: Order): Promise<SavedOrder>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
}
