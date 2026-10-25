import { OrderDateRange } from '../../../domain/value-objects/order/order-date-range.js';
import type { ListPendingOrdersInput, ListPendingOrdersOutput } from '../../dtos/orders/list-pending-orders-dto.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ListPendingOrders {
  public constructor(private orderQueries: OrderQueries) {}

  public async list(input: ListPendingOrdersInput): Promise<ListPendingOrdersOutput> {
    return this.orderQueries.findPending(OrderDateRange.create(input.date));
  }
}
