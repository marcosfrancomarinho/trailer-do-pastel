import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { ListTableOrdersInput, ListTableOrdersOutput } from '../../dtos/tables/list-table-orders-dto.js';
import { ApplicationError } from '../../errors/application-error.js';
import type { TableOrderQueries } from '../../queries/table-order-queries.js';

export class ListTableOrders {
  public constructor(private tableOrders: TableOrderQueries) {}

  public async list(input: ListTableOrdersInput): Promise<ListTableOrdersOutput> {
    const tableId: ReferenceId = ReferenceId.create(input.tableId, 'tableId');
    const table: ListTableOrdersOutput | null = await this.tableOrders.findByTableId(tableId.getValue());

    if (table === null) {
      throw new ApplicationError('tableId', 'NOT_FOUND', 'A mesa informada não foi encontrada.');
    }

    return table;
  }
}
