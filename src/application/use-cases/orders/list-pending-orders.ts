import { OrderDateRange } from '../../../domain/value-objects/order/order-date-range.js';
import type { ListPendingOrdersInput, ListPendingOrdersOutput } from '../../dtos/orders/list-pending-orders-dto.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ListPendingOrders {
  public constructor(private orders: OrderQueries) {}

  public async list(input: ListPendingOrdersInput): Promise<ListPendingOrdersOutput> {
    return this.orders.findPending(OrderDateRange.create(input.date));
  }
}
