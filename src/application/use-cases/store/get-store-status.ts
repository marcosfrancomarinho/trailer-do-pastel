import type { StoreRepository, StoreState } from '../../../domain/repositories/store-repository.js';

export class GetStoreStatus {
  public constructor(private readonly storeRepository: StoreRepository) {}

  public get(): Promise<StoreState> {
    return this.storeRepository.getStatus();
  }
}
