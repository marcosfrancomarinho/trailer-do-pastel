import type { ListTablesOutput } from '../../dtos/tables/list-tables-dto.js';
import type { TableQueries } from '../../queries/table-queries.js';

export class ListTables {
  public constructor(private tables: TableQueries) {}

  public list(): Promise<ListTablesOutput> {
    return this.tables.findAll();
  }
}
