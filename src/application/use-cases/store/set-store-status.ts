import { EventObserver } from '../../observer/event-observer.js';
import type { StoreRepository } from '../../../domain/repositories/store-repository.js';
import type { StoreStatusOutput } from '../../dtos/store/store-status-dto.js';

export class SetStoreStatus {
  public constructor(private storeRepository: StoreRepository, private eventObserver: EventObserver) {}

  private async update(status: 'OPEN' | 'CLOSED'): Promise<StoreStatusOutput> {
    const result = await this.storeRepository.setStatus(status);
    await this.eventObserver.notify({ type: status === 'OPEN' ? 'STORE_OPENED' : 'STORE_CLOSED' });
    return result;
  }

  public open(): Promise<StoreStatusOutput> { return this.update('OPEN'); }
  public close(): Promise<StoreStatusOutput> { return this.update('CLOSED'); }
}
