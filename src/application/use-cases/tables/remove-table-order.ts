import type { RemoveTableOrderInput, RemoveTableOrderOutput } from '../../dtos/tables/remove-table-order-dto.js';
import type { OrderRepository } from '../../../domain/repositories/order-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import { EventObserver } from '../../observer/event-observer.js';

export class RemoveTableOrder {
  public constructor(
    private orders: OrderRepository,
    private events: EventObserver,
  ) {}

  public async remove(input: RemoveTableOrderInput): Promise<RemoveTableOrderOutput> {
    const tableId: string = ReferenceId.create(input.tableId, 'tableId').getValue();
    const orderId: string = ReferenceId.create(input.orderId, 'orderId').getValue();
    const totalSpent: string = await this.orders.removeFromTable(tableId, orderId);

    await this.events.notify({ orderId, status: 'CANCELED', tableId });

    return { orderId, tableId: null, status: 'CANCELED', totalSpent };
  }
}
