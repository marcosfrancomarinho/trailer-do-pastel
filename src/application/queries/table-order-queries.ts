import type { ListTableOrdersOutput, ListTableSessionsOutput } from '../dtos/tables/list-table-orders-dto.js';

export interface TableOrderQueries {
  findByTableId(tableId: string): Promise<ListTableOrdersOutput | null>;
  findSessionsByTableId(tableId: string): Promise<ListTableSessionsOutput | null>;
}
