import type { OrderRepository } from '../../../domain/repositories/order-repository.js';
import { OrderStatus } from '../../../domain/value-objects/order/order-status.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { UpdateOrderStatusInput, UpdateOrderStatusOutput } from '../../dtos/orders/update-order-status-dto.js';
import { EventObserver } from '../../observer/event-observer.js';

export class UpdateOrderStatus {
  public constructor(
    private orderRepository: OrderRepository,
    private eventObserver: EventObserver,
  ) {}

  public async update(input: UpdateOrderStatusInput): Promise<UpdateOrderStatusOutput> {
    const orderId = ReferenceId.create(input.orderId, 'orderId').getValue();
    const orderStatus = OrderStatus.create(input.status);

    await this.orderRepository.updateStatus(orderId, orderStatus);

    const status = orderStatus.getValue();

    await this.eventObserver.notify({ orderId, status });

    return { id: orderId, status };
  }
}
