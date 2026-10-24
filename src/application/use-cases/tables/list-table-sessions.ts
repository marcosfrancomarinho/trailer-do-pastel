import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { ListTableSessionsOutput } from '../../dtos/tables/list-table-orders-dto.js';
import { ApplicationError } from '../../errors/application-error.js';
import type { TableOrderQueries } from '../../queries/table-order-queries.js';

export class ListTableSessions {
  public constructor(private readonly tableOrderQueries: TableOrderQueries) {}

  public async list(input: { tableId: string }): Promise<ListTableSessionsOutput> {
    const tableId = ReferenceId.create(input.tableId, 'tableId').getValue();
    const result = await this.tableOrderQueries.findSessionsByTableId(tableId);
    if (result === null) {
      throw new ApplicationError('tableId', 'NOT_FOUND', 'A mesa informada não foi encontrada.');
    }
    return result;
  }
}
