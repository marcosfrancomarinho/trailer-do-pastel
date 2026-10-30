import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { TrackOrderInput, TrackOrderOutput } from '../../dtos/orders/track-order-dto.js';
import { ApplicationError } from '../../errors/application-error.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class TrackOrder {
  public constructor(private orders: OrderQueries) {}

  public async track(input: TrackOrderInput): Promise<TrackOrderOutput> {
    const trackingToken: ReferenceId = ReferenceId.create(input.trackingToken, 'trackingToken');
    const order: TrackOrderOutput | null = await this.orders.findByTrackingToken(trackingToken.getValue());

    if (!order) {
      throw new ApplicationError('trackingToken', 'NOT_FOUND', 'O pedido informado não foi encontrado.');
    }

    return order;
  }
}
