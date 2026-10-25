import type { OrderRepository } from '../../../domain/repositories/order-repository.js';
import { OrderStatus } from '../../../domain/value-objects/order/order-status.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { UpdateOrderStatusInput, UpdateOrderStatusOutput } from '../../dtos/orders/update-order-status-dto.js';

export class UpdateOrderStatus {
  public constructor(private orderRepository: OrderRepository) {}

  public async update(input: UpdateOrderStatusInput): Promise<UpdateOrderStatusOutput> {
    const orderId = ReferenceId.create(input.orderId, 'orderId');
    const status = OrderStatus.create(input.status);

    await this.orderRepository.updateStatus(orderId.getValue(), status);

    return { status: status.getValue(), id: orderId.getValue() };
  }
}
