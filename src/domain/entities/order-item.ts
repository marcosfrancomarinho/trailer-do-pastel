import { DomainError } from '../errors/domain-error.js';
import { DecimalValue } from '../value-objects/shared/decimal-value.js';
import type { OrderQuantity } from '../value-objects/order/order-quantity.js';
import type { OrderUnitPrice } from '../value-objects/order/order-unit-price.js';
import type { ProductName } from '../value-objects/product/product-name.js';
import type { ReferenceId } from '../value-objects/shared/reference-id.js';
import { OrderItemAddition } from './order-item-addition.js';

export class OrderItem {
  private constructor(
    private productId: ReferenceId,
    private productName: ProductName,
    private quantity: OrderQuantity,
    private unitPrice: OrderUnitPrice,
    private additions: OrderItemAddition[],
  ) {}

  public static create(
    productId: ReferenceId,
    productName: ProductName,
    quantity: OrderQuantity,
    unitPrice: OrderUnitPrice,
    additions: OrderItemAddition[] = [],
  ): OrderItem {
    OrderItem.validateAdditions(additions);
    return new OrderItem(productId, productName, quantity, unitPrice, [...additions]);
  }

  public getProductId(): string {
    return this.productId.getValue();
  }

  public getProductName(): string {
    return this.productName.getValue();
  }

  public getQuantity(): number {
    return this.quantity.getValue();
  }

  public getUnitPrice(): string {
    return this.unitPrice.getValue();
  }

  public getAdditions(): OrderItemAddition[] {
    return [...this.additions];
  }

  public getTotal(): string {
    const unitPrice = DecimalValue.create(this.getUnitPrice());

    const additionsTotal = this.additions.reduce((total, addition) => {
      const additionTotal = DecimalValue.create(addition.getTotal());
      return total.add(additionTotal);
    }, DecimalValue.create('0'));

    const unitTotal = unitPrice.add(additionsTotal);
    const quantity = DecimalValue.create(String(this.getQuantity()));
    const total = unitTotal.multiply(quantity);

    return total.getValue();
  }

  private static validateAdditions(additions: unknown): void {
    if (additions === undefined || additions === null) {
      throw new DomainError('additions', 'REQUIRED', 'Os adicionais não podem ser nulos ou indefinidos.');
    }

    if (!Array.isArray(additions)) {
      throw new DomainError('additions', 'INVALID_TYPE', 'Os adicionais devem ser uma lista de entidades OrderItemAddition.');
    }

    const additionIds = new Set<string>();
    for (const addition of additions) {
      if (!(addition instanceof OrderItemAddition)) {
        throw new DomainError('additions', 'INVALID_TYPE', 'Os adicionais devem ser entidades OrderItemAddition.');
      }

      const additionId = addition.getAdditionId();
      if (additionIds.has(additionId)) {
        throw new DomainError(
          'additions',
          'DUPLICATE',
          'Um adicional não pode se repetir no mesmo item; informe sua quantidade.',
        );
      }

      additionIds.add(additionId);
    }
  }
}
