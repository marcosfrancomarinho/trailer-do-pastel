import type { SavedOrder, OrderRepository } from '../../../domain/repositories/order-repository.js';
import { Order } from '../../../domain/entities/order.js';
import type { OrderItem } from '../../../domain/entities/order-item.js';
import { CustomerName } from '../../../domain/value-objects/customer/customer-name.js';
import { CustomerPhone } from '../../../domain/value-objects/customer/customer-phone.js';
import { OrderObservation } from '../../../domain/value-objects/order/order-observation.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { CreateOrderInput, CreateOrderOutput } from '../../dtos/orders/create-order-dto.js';
import { CreateOrderItemService } from '../../services/create-order-item-service.js';
import { EventObserver } from '../../observer/event-observer.js';

export class CreateOrder {
  public constructor(
    private orders: OrderRepository,
    private orderItems: CreateOrderItemService,
    private events: EventObserver,
  ) {}

  public async create(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const customerName: CustomerName = CustomerName.create(input.customerName);
    const customerPhone: CustomerPhone = CustomerPhone.create(input.customerPhone);
    const observation: OrderObservation = OrderObservation.create(input.observation);
    const tableId: ReferenceId | null = input.tableId == null ? null : ReferenceId.create(input.tableId, 'tableId');
    const userId: ReferenceId | null = tableId === null ? null : ReferenceId.create(input.userId as string, 'userId');
    const items: OrderItem[] = [];

    for (const item of input.items) {
      const orderItem: OrderItem = await this.orderItems.create(item);
      items.push(orderItem);
    }

    const order: Order = Order.create(customerName, customerPhone, items, observation, tableId, undefined, userId);
    const { id, trackingToken }: SavedOrder = await this.orders.save(order);

    await this.events.notify({
      orderId: id,
      status: order.getStatus(),
      tableId: order.getTableId(),
    });

    return {
      id,
      trackingToken,
      status: order.getStatus(),
      total: order.getTotal(),
      tableId: order.getTableId(),
    };
  }
}
