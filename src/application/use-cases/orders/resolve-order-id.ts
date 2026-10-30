import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { ResolveOrderIdInput, ResolveOrderIdOutput } from '../../dtos/orders/resolve-order-id-dto.js';
import { ApplicationError } from '../../errors/application-error.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ResolveOrderId {
  public constructor(private orders: OrderQueries) {}

  public async resolve(input: ResolveOrderIdInput): Promise<ResolveOrderIdOutput> {
    const trackingToken: ReferenceId = ReferenceId.create(input.trackingToken, 'trackingToken');
    const id: string | null = await this.orders.findOrderIdByTrackingToken(trackingToken.getValue());

    if (id === null) {
      throw new ApplicationError('trackingToken', 'NOT_FOUND', 'O pedido informado não foi encontrado.');
    }

    return { id };
  }
}
