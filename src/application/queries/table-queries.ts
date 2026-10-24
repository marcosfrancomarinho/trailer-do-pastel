import type { ListTablesOutput } from '../dtos/tables/list-tables-dto.js';

export interface TableQueries {
  findAll(): Promise<ListTablesOutput>;
}
