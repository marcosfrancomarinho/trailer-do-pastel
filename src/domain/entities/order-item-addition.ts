import { DecimalValue } from '../value-objects/shared/decimal-value.js';
import type { OrderQuantity } from '../value-objects/order/order-quantity.js';
import type { OrderUnitPrice } from '../value-objects/order/order-unit-price.js';
import type { ReferenceId } from '../value-objects/shared/reference-id.js';

export class OrderItemAddition {
  private constructor(
    private readonly additionId: ReferenceId,
    private readonly quantity: OrderQuantity,
    private readonly unitPrice: OrderUnitPrice,
  ) {}

  public static create(additionId: ReferenceId, quantity: OrderQuantity, unitPrice: OrderUnitPrice): OrderItemAddition {
    return new OrderItemAddition(additionId, quantity, unitPrice);
  }

  public getAdditionId(): string {
    return this.additionId.getValue();
  }

  public getQuantity(): number {
    return this.quantity.getValue();
  }

  public getUnitPrice(): string {
    return this.unitPrice.getValue();
  }

  public getTotal(): string {
    const unitPrice = DecimalValue.create(this.getUnitPrice());
    const quantity = DecimalValue.create(String(this.getQuantity()));
    const total = unitPrice.multiply(quantity);
    return total.getValue();
  }
}
