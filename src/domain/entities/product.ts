import { DomainError } from '../errors/domain-error.js';
import type { DecimalValue } from '../value-objects/shared/decimal-value.js';
import { ProductDescription } from '../value-objects/product/product-description.js';
import type { ProductName } from '../value-objects/product/product-name.js';
import type { ProductPrice } from '../value-objects/product/product-price.js';
import { ReferenceId } from '../value-objects/shared/reference-id.js';

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
    if (description === null || description === undefined) {
      throw new DomainError('description', 'REQUIRED', 'A descrição do produto é obrigatória.');
    }

    if (!(description instanceof ProductDescription)) {
      throw new DomainError('description', 'INVALID_TYPE', 'A descrição do produto deve ser válida.');
    }

    if (categoryId === null || categoryId === undefined) {
      throw new DomainError('categoryId', 'REQUIRED', 'A categoria do produto é obrigatória.');
    }

    if (!(categoryId instanceof ReferenceId)) {
      throw new DomainError('categoryId', 'INVALID_TYPE', 'A categoria do produto deve ser um identificador.');
    }

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
