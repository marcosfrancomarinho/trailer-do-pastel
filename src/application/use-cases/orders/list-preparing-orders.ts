import type { ListPreparingOrdersOutput } from '../../dtos/orders/list-preparing-orders-dto.js';
import type { OrderQueries } from '../../queries/order-queries.js';

export class ListPreparingOrders {
  public constructor(private readonly orderQueries: OrderQueries) {}

  public async list(): Promise<ListPreparingOrdersOutput> {
    return this.orderQueries.findPreparing();
  }
}
