import { DomainError } from '../../errors/domain-error.js';
import { DecimalValue } from '../shared/decimal-value.js';

export class OrderUnitPrice {
  private constructor(private readonly price: DecimalValue) {}

  public static create(price: DecimalValue): OrderUnitPrice {
    OrderUnitPrice.validate(price);
    return new OrderUnitPrice(price);
  }

  public getValue(): string {
    return this.price.getValue();
  }

  private static validate(price: unknown): void {
    if (price === undefined || price === null) {
      throw new DomainError('unitPrice', 'REQUIRED', 'O preço unitário não pode ser nulo ou indefinido.');
    }

    if (!(price instanceof DecimalValue)) {
      throw new DomainError('unitPrice', 'INVALID_TYPE', 'O preço unitário deve ser uma instância de DecimalValue.');
    }

    if (price.getValue() === '0' || price.getValue().startsWith('-')) {
      throw new DomainError('unitPrice', 'NON_POSITIVE', 'O preço unitário deve ser maior que zero.');
    }
  }
}
