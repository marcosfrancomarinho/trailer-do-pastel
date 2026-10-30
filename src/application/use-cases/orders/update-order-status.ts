import type { OrderStatusValue } from '../../../domain/value-objects/order/order-status.js';
import type { OrderRepository } from '../../../domain/repositories/order-repository.js';
import { OrderStatus } from '../../../domain/value-objects/order/order-status.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { UpdateOrderStatusInput, UpdateOrderStatusOutput } from '../../dtos/orders/update-order-status-dto.js';
import { EventObserver } from '../../observer/event-observer.js';

export class UpdateOrderStatus {
  public constructor(
    private orders: OrderRepository,
    private events: EventObserver,
  ) {}

  public async update(input: UpdateOrderStatusInput): Promise<UpdateOrderStatusOutput> {
    const orderId: ReferenceId = ReferenceId.create(input.orderId, 'orderId');
    const orderStatus: OrderStatus = OrderStatus.create(input.status);

    await this.orders.updateStatus(orderId.getValue(), orderStatus);

    const status: OrderStatusValue = orderStatus.getValue();

    await this.events.notify({ orderId, status });

    return { id: orderId.getValue(), status };
  }
}
