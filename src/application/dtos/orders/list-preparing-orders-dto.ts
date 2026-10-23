import type { PendingOrderItem } from './list-pending-orders-dto.js';

export interface ListPreparingOrdersInput {
  date?: unknown;
}

export interface PreparingOrderListItem {
  id: string;
  customerName: string;
  customerPhone: string;
  status: 'CONFIRMED' | 'PREPARING';
  total: string;
  createdAt: string;
  updatedAt: string;
  items: PendingOrderItem[];
}

export type ListPreparingOrdersOutput = PreparingOrderListItem[];
