import type { OrderStatusValue } from '../../../domain/value-objects/order/order-status.js';
import type { PendingOrderItem } from './list-pending-orders-dto.js';

export interface OrderHistoryEntry {
  status: OrderStatusValue;
  changedAt: string;
}

export interface OrderHistoryListItem {
  id: string;
  customerName: string;
  customerPhone: string;
  status: 'COMPLETED' | 'CANCELED';
  total: string;
  createdAt: string;
  updatedAt: string;
  items: PendingOrderItem[];
  histories: OrderHistoryEntry[];
}

export type ListOrderHistoryOutput = OrderHistoryListItem[];
