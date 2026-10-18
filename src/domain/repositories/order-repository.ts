import type { Order } from '../entities/order.js';

export interface SavedOrder {
  id: string;
  trackingToken: string;
}

export interface OrderRepository {
  save(order: Order): Promise<SavedOrder>;
}
