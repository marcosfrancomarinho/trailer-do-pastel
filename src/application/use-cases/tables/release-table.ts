import { EventObserver } from '../../observer/event-observer.js';
import type { ReleaseTableInput, ReleaseTableOutput } from '../../dtos/tables/release-table-dto.js';
import type { TableRepository } from '../../../domain/repositories/table-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';

export class ReleaseTable {
  public constructor(private tableRepository: TableRepository, private eventObserver: EventObserver) {}

  public async release(input: ReleaseTableInput): Promise<ReleaseTableOutput> {
    const tableId = ReferenceId.create(input.tableId, 'tableId').getValue();
    const result = await this.tableRepository.release(tableId);
    // O SSE apenas avisa os painéis administrativos para consultarem o estado atual da mesa.
    await this.eventObserver.notify({ orderId: '', status: 'TABLE_RELEASED', tableId });
    return result;
  }
}
