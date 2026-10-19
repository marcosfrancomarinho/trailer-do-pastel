import type { PendingOrderListItem } from '../dtos/list-pending-orders-dto.js';

export interface OrderQueries {
  findPending(): Promise<PendingOrderListItem[]>;
}
