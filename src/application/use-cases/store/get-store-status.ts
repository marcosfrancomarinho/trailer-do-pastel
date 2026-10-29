import type { StoreState } from '../../../domain/entities/store-state.js';
import type { StoreRepository } from '../../../domain/repositories/store-repository.js';
import type { StoreStatusOutput } from '../../dtos/store/store-status-dto.js';

export class GetStoreStatus {
  public constructor(private store: StoreRepository) {}

  public async get(): Promise<StoreStatusOutput> {
    const state: StoreState = await this.store.getStatus();
    return { status: state.getStatus(), updatedAt: state.getUpdatedAt().toISOString() };
  }
}
