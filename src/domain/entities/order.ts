import { DomainError } from '../errors/domain-error.js';
import { DecimalValue } from '../value-objects/shared/decimal-value.js';
import { OrderItem } from './order-item.js';
import type { CustomerName } from '../value-objects/customer/customer-name.js';
import type { CustomerPhone } from '../value-objects/customer/customer-phone.js';
import { OrderObservation } from '../value-objects/order/order-observation.js';
import type { ReferenceId } from '../value-objects/shared/reference-id.js';

export class Order {
  private constructor(
    private readonly customerName: CustomerName,
    private readonly customerPhone: CustomerPhone,
    private readonly items: OrderItem[],
    private readonly observation: OrderObservation,
    private readonly tableId: ReferenceId | null,
    private readonly id: string | undefined,
  ) {}

  public static create(
    customerName: CustomerName,
    customerPhone: CustomerPhone,
    items: OrderItem[] = [],
    observation: OrderObservation = OrderObservation.create(),
    tableId: ReferenceId | null = null,
    id?: string,
  ): Order {
    Order.validateItems(items);
    return new Order(customerName, customerPhone, [...items], observation, tableId, id);
  }

  public getId(): string {
    if (this.id === undefined) {
      throw new DomainError('id', 'REQUIRED', 'O pedido ainda não possui um ID.');
    }
    return this.id;
  }

  public getCustomerName(): string {
    return this.customerName.getValue();
  }

  public getCustomerPhone(): string {
    return this.customerPhone.getValue();
  }

  public getObservation(): string | null {
    return this.observation.getValue();
  }

  public getTableId(): string | null {
    return this.tableId?.getValue() ?? null;
  }

  public getItems(): OrderItem[] {
    return [...this.items];
  }

  public getStatus(): 'PENDING' {
    return 'PENDING';
  }

  public getTotal(): string {
    const total = this.items.reduce((total, item) => {
      const itemTotal = DecimalValue.create(item.getTotal());
      return total.add(itemTotal);
    }, DecimalValue.create('0'));

    return total.getValue();
  }

  private static validateItems(items: readonly OrderItem[]): void {
    if (items === undefined || items === null) {
      throw new DomainError('items', 'REQUIRED', 'Os itens do pedido não podem ser nulos ou indefinidos.');
    }

    if (!Array.isArray(items)) {
      throw new DomainError('items', 'INVALID_TYPE', 'Os itens do pedido devem ser uma lista de entidades OrderItem.');
    }

    if (items.length === 0) {
      throw new DomainError('items', 'EMPTY', 'O pedido deve ter pelo menos um item.');
    }

    for (const item of items) {
      if (!(item instanceof OrderItem)) {
        throw new DomainError('items', 'INVALID_TYPE', 'Os itens do pedido devem ser entidades OrderItem.');
      }
    }
  }
}
