import type { StoreRepository } from '../../../domain/repositories/store-repository.js';
import type { StoreStatusOutput } from '../../dtos/store/store-status-dto.js';

export class SetStoreStatus {
  public constructor(private readonly storeRepository: StoreRepository) {}

  public open(): Promise<StoreStatusOutput> {
    return this.storeRepository.setStatus('OPEN');
  }

  public close(): Promise<StoreStatusOutput> {
    return this.storeRepository.setStatus('CLOSED');
  }
}
