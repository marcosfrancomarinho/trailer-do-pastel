import { DomainError } from '../../errors/domain-error.js';
import { DecimalValue } from '../shared/decimal-value.js';

export class ProductPrice {
  private constructor(private readonly price: DecimalValue) {}

  public static create(price: DecimalValue): ProductPrice {
    ProductPrice.validate(price);
    return new ProductPrice(price);
  }

  public getValue(): DecimalValue {
    return this.price;
  }

  private static validate(price: unknown): void {
    if (price === undefined || price === null) {
      throw new DomainError('price', 'REQUIRED', 'O preço do produto não pode ser nulo ou indefinido.');
    }

    if (!(price instanceof DecimalValue)) {
      throw new DomainError('price', 'INVALID_TYPE', 'O preço do produto deve ser uma instância de DecimalValue.');
    }

    // DecimalValue normaliza o zero para '0' e preserva o sinal dos negativos.
    if (price.getValue() === '0' || price.getValue().startsWith('-')) {
      throw new DomainError('price', 'NON_POSITIVE', 'O preço do produto deve ser maior que zero.');
    }
  }
}
