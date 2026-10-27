import { DomainError } from '../../../domain/errors/domain-error.js';
import type {
  ListClosedTableSessionsInput,
  ListClosedTableSessionsOutput,
} from '../../dtos/tables/list-closed-table-sessions-dto.js';
import type { TableOrderQueries } from '../../queries/table-order-queries.js';

export class ListClosedTableSessions {
  public constructor(private tableOrderQueries: TableOrderQueries) {}

  public async list(input: ListClosedTableSessionsInput): Promise<ListClosedTableSessionsOutput> {
    const dateIsValid = this.isValidDate(input.date);

    if (!dateIsValid) {
      throw new DomainError('date', 'INVALID_DATE', 'Informe uma data válida no formato AAAA-MM-DD.');
    }

    const comandas = await this.tableOrderQueries.findClosedSessions(input.date);
    return { comandas };
  }

  private isValidDate(date: string): boolean {
    const hasExpectedFormat = /^\d{4}-\d{2}-\d{2}$/.test(date);

    if (!hasExpectedFormat) {
      return false;
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);
    const canParseDate = Number.isFinite(parsedDate.getTime());

    if (!canParseDate) {
      return false;
    }

    const calendarDate = parsedDate.toISOString().slice(0, 10);
    return calendarDate === date;
  }
}
