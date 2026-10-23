import type { PendingOrderListItem } from '../dtos/orders/list-pending-orders-dto.js';
import type { TrackOrderOutput } from '../dtos/orders/track-order-dto.js';

export interface OrderQueries {
  findPending(): Promise<PendingOrderListItem[]>;
  findByTrackingToken(trackingToken: string): Promise<TrackOrderOutput | null>;
}
