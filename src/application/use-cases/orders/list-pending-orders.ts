import { orderDateRange } from '../../dtos/orders/order-date-range.js';
import type { ListPendingOrdersOutput } from '../../dtos/orders/list-pending-orders-dto.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ListPendingOrders {
  public constructor(private readonly orderQueries: OrderQueries) {}

  public async list(date?: unknown): Promise<ListPendingOrdersOutput> {
    return this.orderQueries.findPending(orderDateRange(date));
  }
}
