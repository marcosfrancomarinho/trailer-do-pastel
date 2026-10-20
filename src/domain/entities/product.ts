import { DomainError } from '../errors/domain-error.js';
import type { DecimalValue } from '../value-objects/shared/decimal-value.js';
import type { ProductDescription } from '../value-objects/product/product-description.js';
import type { ProductName } from '../value-objects/product/product-name.js';
import type { ProductPrice } from '../value-objects/product/product-price.js';
import type { ReferenceId } from '../value-objects/shared/reference-id.js';

export class Product {
  private constructor(
    private readonly name: ProductName,
    private readonly price: ProductPrice,
    private readonly description: ProductDescription,
    private readonly categoryId: ReferenceId,
    private readonly available: boolean,
    private readonly id: string | undefined,
  ) {}

  public static create(
    name: ProductName,
    price: ProductPrice,
    description: ProductDescription,
    categoryId: ReferenceId,
    available: boolean = true,
    id?: string,
  ): Product {
    return new Product(name, price, description, categoryId, available, id);
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

  public getDescription(): string {
    return this.description.getValue();
  }

  public getCategoryId(): string {
    return this.categoryId.getValue();
  }

  public getPrice(): DecimalValue {
    return this.price.getValue();
  }

  public isAvailable(): boolean {
    return this.available;
  }
}
