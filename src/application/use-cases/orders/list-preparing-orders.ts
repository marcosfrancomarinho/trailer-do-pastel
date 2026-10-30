import { OrderDateRange } from '../../../domain/value-objects/order/order-date-range.js';
import type { ListPreparingOrdersInput, ListPreparingOrdersOutput } from '../../dtos/orders/list-preparing-orders-dto.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ListPreparingOrders {
  public constructor(private orders: OrderQueries) {}

  public async list(input: ListPreparingOrdersInput): Promise<ListPreparingOrdersOutput> {
    const dateRange: OrderDateRange = OrderDateRange.create(input.date);

    return this.orders.findPreparing(dateRange);
  }
}
