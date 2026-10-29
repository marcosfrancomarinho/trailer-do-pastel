import type { StoreRepository } from '../../../domain/repositories/store-repository.js';
import type { StoreStatusOutput } from '../../dtos/store/store-status-dto.js';

export class GetStoreStatus {
  public constructor(private store: StoreRepository) {}

  public get(): Promise<StoreStatusOutput> {
    return this.store.getStatus();
  }
}
