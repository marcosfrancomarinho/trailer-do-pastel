import type { PendingOrderListItem } from '../dtos/orders/list-pending-orders-dto.js';
import type { OrderHistoryListItem } from '../dtos/orders/list-order-history-dto.js';
import type { TrackOrderOutput } from '../dtos/orders/track-order-dto.js';

export interface OrderQueries {
  findPending(): Promise<PendingOrderListItem[]>;
  findHistory(): Promise<OrderHistoryListItem[]>;
  findByTrackingToken(trackingToken: string): Promise<TrackOrderOutput | null>;
}
