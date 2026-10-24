import type { TableSessionListItem } from './list-table-sessions-dto.js';

export interface ClosedTableSessionListItem {
  tableId: string | null;
  tableNumber: number | null;
  origin: 'TABLE' | 'ONLINE';
  session: TableSessionListItem;
}

export interface ListClosedTableSessionsOutput {
  comandas: ClosedTableSessionListItem[];
}
