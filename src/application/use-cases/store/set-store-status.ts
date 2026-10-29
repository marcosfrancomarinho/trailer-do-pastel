import type { StoreState, StoreRepository } from '../../../domain/repositories/store-repository.js';
import { EventObserver } from '../../observer/event-observer.js';
import type { StoreStatusOutput } from '../../dtos/store/store-status-dto.js';

export class SetStoreStatus {
  public constructor(private store: StoreRepository, private events: EventObserver) {}

  private async update(status: 'OPEN' | 'CLOSED'): Promise<StoreStatusOutput> {
    const result: StoreState = await this.store.setStatus(status);
    await this.events.notify({ type: status === 'OPEN' ? 'STORE_OPENED' : 'STORE_CLOSED' });
    return result;
  }

  public open(): Promise<StoreStatusOutput> { return this.update('OPEN'); }
  public close(): Promise<StoreStatusOutput> { return this.update('CLOSED'); }
}
