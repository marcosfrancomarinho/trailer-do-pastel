import { EventObserver } from '../../observer/event-observer.js';
import type { TableRepository } from '../../../domain/repositories/table-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { DeleteTableInput } from '../../dtos/tables/delete-table-dto.js';

export class DeleteTable {
  public constructor(private tableRepository: TableRepository, private eventObserver: EventObserver) {}

  public async delete(input: DeleteTableInput): Promise<void> {
    const tableId = ReferenceId.create(input.tableId, 'tableId');
    await this.tableRepository.archive(tableId.getValue());
    await this.eventObserver.notify({ type: 'TABLE_ARCHIVED', tableId: tableId.getValue() });
  }
}
