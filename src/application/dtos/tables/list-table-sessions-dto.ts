import type { TableOrderListItem } from './list-table-orders-dto.js';

export interface ListTableSessionsInput {
  tableId: string;
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
