import { OrderDateRange } from '../../../domain/value-objects/order/order-date-range.js';
import type { ListOrderHistoryInput, ListOrderHistoryOutput } from '../../dtos/orders/list-order-history-dto.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ListOrderHistory {
  public constructor(private orderQueries: OrderQueries) {}

  public async list(input: ListOrderHistoryInput): Promise<ListOrderHistoryOutput> {
    return this.orderQueries.findHistory(OrderDateRange.create(input.date));
  }
}
