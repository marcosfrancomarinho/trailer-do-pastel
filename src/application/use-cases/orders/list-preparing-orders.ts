import { orderDateRange } from '../../dtos/orders/order-date-range.js';
import type { ListPreparingOrdersOutput } from '../../dtos/orders/list-preparing-orders-dto.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ListPreparingOrders {
  public constructor(private readonly orderQueries: OrderQueries) {}

  public async list(date?: unknown): Promise<ListPreparingOrdersOutput> {
    return this.orderQueries.findPreparing(orderDateRange(date));
  }
}
