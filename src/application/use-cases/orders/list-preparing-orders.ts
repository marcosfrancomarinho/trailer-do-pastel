import { OrderDateRange } from '../../../domain/value-objects/order/order-date-range.js';
import type { ListPreparingOrdersInput, ListPreparingOrdersOutput } from '../../dtos/orders/list-preparing-orders-dto.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ListPreparingOrders {
  public constructor(private orderQueries: OrderQueries) {}

  public async list(input: ListPreparingOrdersInput): Promise<ListPreparingOrdersOutput> {
    return this.orderQueries.findPreparing(OrderDateRange.create(input.date));
  }
}
