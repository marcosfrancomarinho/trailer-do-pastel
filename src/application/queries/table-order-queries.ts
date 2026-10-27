import type { ListTableOrdersOutput } from '../dtos/tables/list-table-orders-dto.js';
import type { ClosedTableSessionListItem } from '../dtos/tables/list-closed-table-sessions-dto.js';
import type { ListTableSessionsOutput } from '../dtos/tables/list-table-sessions-dto.js';

export interface TableOrderQueries {
  findClosedSessions(date: string): Promise<ClosedTableSessionListItem[]>;
  findByTableId(tableId: string): Promise<ListTableOrdersOutput | null>;
  findSessionsByTableId(tableId: string): Promise<ListTableSessionsOutput | null>;
}
