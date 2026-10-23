import { orderDateRange } from '../../dtos/orders/order-date-range.js';
import type { ListOrderHistoryOutput } from '../../dtos/orders/list-order-history-dto.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ListOrderHistory {
  public constructor(private readonly orderQueries: OrderQueries) {}

  public async list(date?: unknown): Promise<ListOrderHistoryOutput> {
    return this.orderQueries.findHistory(orderDateRange(date));
  }
}
