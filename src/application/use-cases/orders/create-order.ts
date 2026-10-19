import { Order } from '../../../domain/entities/order.js';
import type { OrderItem } from '../../../domain/entities/order-item.js';
import type { OrderRepository } from '../../../domain/repositories/order-repository.js';
import { CustomerName } from '../../../domain/value-objects/customer/customer-name.js';
import { CustomerPhone } from '../../../domain/value-objects/customer/customer-phone.js';
import type { CreateOrderInput, CreateOrderOutput } from '../../dtos/create-order-dto.js';
import { CreateOrderItemService } from '../../services/create-order-item-service.js';

export class CreateOrder {
  public constructor(
    private readonly orderRepository: OrderRepository,
    private readonly createOrderItemService: CreateOrderItemService,
  ) {}

  public async create(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const customerName = CustomerName.create(input.customerName);
    const customerPhone = CustomerPhone.create(input.customerPhone);
    const items: OrderItem[] = [];

    for (const item of input.items) {
      const orderItem = await this.createOrderItemService.create(item);
      items.push(orderItem);
    }

    const order = Order.create(customerName, customerPhone, items);
    const { id, trackingToken } = await this.orderRepository.save(order);

    return {
      id,
      trackingToken,
      status: order.getStatus(),
      total: order.getTotal(),
    };
  }
}
