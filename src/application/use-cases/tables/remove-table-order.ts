import type { RemoveTableOrderInput, RemoveTableOrderOutput } from '../../dtos/tables/remove-table-order-dto.js';
import type { OrderRepository } from '../../../domain/repositories/order-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';

export class RemoveTableOrder {
  public constructor(private readonly orderRepository: OrderRepository) {}

  public async remove(input: RemoveTableOrderInput): Promise<RemoveTableOrderOutput> {
    const tableId = ReferenceId.create(input.tableId, 'tableId').getValue();
    const orderId = ReferenceId.create(input.orderId, 'orderId').getValue();
    const totalSpent = await this.orderRepository.removeFromTable(tableId, orderId);

    return { orderId, tableId: null, status: 'CANCELED', totalSpent };
  }
}
