import type { ListPendingOrdersOutput } from '../../dtos/orders/list-pending-orders-dto.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ListPendingOrders {
  public constructor(private readonly orderQueries: OrderQueries) {}

  public async list(): Promise<ListPendingOrdersOutput> {
    return this.orderQueries.findPending();
  }
}
