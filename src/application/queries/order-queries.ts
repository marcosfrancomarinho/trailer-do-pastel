import type { OrderDateRange } from '../dtos/orders/order-date-range.js';
import type { PendingOrderListItem } from '../dtos/orders/list-pending-orders-dto.js';
import type { OrderHistoryListItem } from '../dtos/orders/list-order-history-dto.js';
import type { PreparingOrderListItem } from '../dtos/orders/list-preparing-orders-dto.js';
import type { TrackOrderOutput } from '../dtos/orders/track-order-dto.js';

export interface OrderQueries {
  findPending(range?: OrderDateRange): Promise<PendingOrderListItem[]>;
  findPreparing(range?: OrderDateRange): Promise<PreparingOrderListItem[]>;
  findHistory(range?: OrderDateRange): Promise<OrderHistoryListItem[]>;
  findByTrackingToken(trackingToken: string): Promise<TrackOrderOutput | null>;
}
