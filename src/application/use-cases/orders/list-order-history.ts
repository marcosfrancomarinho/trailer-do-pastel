import type { ListOrderHistoryOutput } from '../../dtos/orders/list-order-history-dto.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ListOrderHistory {
  public constructor(private readonly orderQueries: OrderQueries) {}

  public async list(): Promise<ListOrderHistoryOutput> {
    return this.orderQueries.findHistory();
  }
}
