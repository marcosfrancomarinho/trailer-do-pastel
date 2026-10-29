import { EventObserver } from '../../observer/event-observer.js';
import type { TableRepository } from '../../../domain/repositories/table-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { DeleteTableInput } from '../../dtos/tables/delete-table-dto.js';

export class DeleteTable {
  public constructor(private tables: TableRepository, private events: EventObserver) {}

  public async delete(input: DeleteTableInput): Promise<void> {
    const tableId: ReferenceId = ReferenceId.create(input.tableId, 'tableId');
    await this.tables.archive(tableId.getValue());
    await this.events.notify({ type: 'TABLE_ARCHIVED', tableId: tableId.getValue() });
  }
}
