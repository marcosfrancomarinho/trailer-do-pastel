import type { StoreRepository, StoreState } from '../../../domain/repositories/store-repository.js';

export class SetStoreStatus {
  public constructor(private readonly storeRepository: StoreRepository) {}

  public open(): Promise<StoreState> {
    return this.storeRepository.setStatus('OPEN');
  }

  public close(): Promise<StoreState> {
    return this.storeRepository.setStatus('CLOSED');
  }
}
