import type { StoreState, StoreStatus } from '../entities/store-state.js';

export interface StoreRepository {
  getStatus(): Promise<StoreState>;
  setStatus(status: StoreStatus): Promise<StoreState>;
}
