import type { TableOrderQueries } from '../../queries/table-order-queries.js';
import type { ListClosedTableSessionsOutput } from '../../dtos/tables/list-closed-table-sessions-dto.js';
import { DomainError } from '../../../domain/errors/domain-error.js';

export class ListClosedTableSessions {
  public constructor(private readonly queries: TableOrderQueries) {}

  public async list(date?: string): Promise<ListClosedTableSessionsOutput> {
    if (date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date + 'T00:00:00Z'))
        || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) {
        throw new DomainError('date', 'INVALID_DATE', 'Informe uma data válida no formato AAAA-MM-DD.');
      }
    }
    return { comandas: await this.queries.findClosedSessions(date) };
  }
}
