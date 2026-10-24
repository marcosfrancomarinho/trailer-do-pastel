import type { TableSessionListItem } from './list-table-sessions-dto.js';

export interface ClosedTableSessionListItem {
  tableId: string;
  tableNumber: number;
  session: TableSessionListItem;
}

export interface ListClosedTableSessionsOutput {
  comandas: ClosedTableSessionListItem[];
}
