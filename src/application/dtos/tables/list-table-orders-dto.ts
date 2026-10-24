import type { OrderStatusValue } from '../../../domain/value-objects/order/order-status.js';
import type { TableStatusValue } from '../../../domain/value-objects/table/table-status.js';
import type { PendingOrderItem } from '../orders/list-pending-orders-dto.js';

export interface ListTableOrdersInput {
  tableId: string;
}

export interface TableOrderListItem {
  id: string;
  customerName: string;
  customerPhone: string;
  observation: string | null;
  tableId: string | null;
  status: OrderStatusValue;
  total: string;
  createdAt: string;
  updatedAt: string;
  items: PendingOrderItem[];
}

export interface ListTableOrdersOutput {
  tableId: string;
  number: number;
  status: TableStatusValue;
  totalSpent: string;
  sessionId: string | null;
  orders: TableOrderListItem[];
}

export interface TableSessionListItem {
  id: string;
  openedAt: string;
  closedAt: string | null;
  closedTotal: string | null;
  orders: TableOrderListItem[];
}

export interface ListTableSessionsOutput {
  tableId: string;
  sessions: TableSessionListItem[];
}
