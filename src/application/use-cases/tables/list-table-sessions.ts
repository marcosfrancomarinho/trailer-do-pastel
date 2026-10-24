import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { ListTableSessionsInput, ListTableSessionsOutput } from '../../dtos/tables/list-table-sessions-dto.js';
import { ApplicationError } from '../../errors/application-error.js';
import type { TableOrderQueries } from '../../queries/table-order-queries.js';

export class ListTableSessions {
  public constructor(private readonly tableOrderQueries: Pick<TableOrderQueries, 'findSessionsByTableId'>) {}

  public async list(input: ListTableSessionsInput): Promise<ListTableSessionsOutput> {
    const tableId = ReferenceId.create(input.tableId, 'tableId');
    const result = await this.tableOrderQueries.findSessionsByTableId(tableId.getValue());
    if (result === null) {
      throw new ApplicationError('tableId', 'NOT_FOUND', 'A mesa informada não foi encontrada.');
    }
    return result;
  }
}
