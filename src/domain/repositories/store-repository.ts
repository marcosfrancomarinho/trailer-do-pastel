export type StoreStatus = 'OPEN' | 'CLOSED';

export interface StoreState {
  status: StoreStatus;
  updatedAt: string;
}

export interface StoreRepository {
  getStatus(): Promise<StoreState>;
  setStatus(status: StoreStatus): Promise<StoreState>;
}
