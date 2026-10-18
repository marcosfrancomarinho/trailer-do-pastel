import { DomainError } from '../errors/domain-error.js';
import type { DecimalValue } from '../value-objects/shared/decimal-value.js';
import type { ProductCreatedAt } from '../value-objects/product/product-created-at.js';
import type { ProductDescription } from '../value-objects/product/product-description.js';
import type { ProductName } from '../value-objects/product/product-name.js';
import type { ProductPrice } from '../value-objects/product/product-price.js';

export class Product {
  private constructor(
    private readonly name: ProductName,
    private readonly price: ProductPrice,
    private readonly description: ProductDescription | null,
    private readonly available: boolean,
    private readonly createdAt: ProductCreatedAt,
    private readonly id: string | undefined,
  ) {}

  public static create(
    name: ProductName,
    price: ProductPrice,
    description: ProductDescription | null,
    createdAt: ProductCreatedAt,
    available: boolean = true,
    id?: string,
  ): Product {
    return new Product(name, price, description, available, createdAt, id);
  }

  public getId(): string {
    if (this.id === undefined) {
      throw new DomainError('id', 'REQUIRED', 'O produto ainda não possui um ID.');
    }

    return this.id;
  }

  public getName(): string {
    return this.name.getValue();
  }

  public getDescription(): string | null {
    return this.description?.getValue() ?? null;
  }

  public getPrice(): DecimalValue {
    return this.price.getValue();
  }

  public isAvailable(): boolean {
    return this.available;
  }

  public getCreatedAt(): Date {
    return this.createdAt.getValue();
  }
}
