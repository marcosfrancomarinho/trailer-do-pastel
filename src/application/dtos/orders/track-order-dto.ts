import type { OrderStatusValue } from '../../../domain/value-objects/order/order-status.js';

export interface TrackOrderInput {
  trackingToken: string;
}

export interface TrackOrderOutput {
  status: OrderStatusValue;
  updatedAt: string;
}
