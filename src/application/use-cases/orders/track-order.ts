import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { TrackOrderInput, TrackOrderOutput } from '../../dtos/orders/track-order-dto.js';
import { ApplicationError } from '../../errors/application-error.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class TrackOrder {
  public constructor(private orderQueries: OrderQueries) {}

  public async resolveOrderId(trackingTokenValue: string): Promise<string> {
    const trackingToken = ReferenceId.create(trackingTokenValue, 'trackingToken');
    const id = await this.orderQueries.findOrderIdByTrackingToken(trackingToken.getValue());
    if (!id) throw new ApplicationError('trackingToken', 'NOT_FOUND', 'O pedido informado não foi encontrado.');
    return id;
  }

  public async track(input: TrackOrderInput): Promise<TrackOrderOutput> {
    const trackingToken = ReferenceId.create(input.trackingToken, 'trackingToken');
    const order = await this.orderQueries.findByTrackingToken(trackingToken.getValue());

    if (!order) {
      throw new ApplicationError('trackingToken', 'NOT_FOUND', 'O pedido informado não foi encontrado.');
    }

    return order;
  }
}
