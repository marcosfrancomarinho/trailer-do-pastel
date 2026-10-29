import { DomainError } from '../errors/domain-error.js';
import type { ProductDescription } from '../value-objects/product/product-description.js';
import type { ProductImageUrl } from '../value-objects/product/product-image-url.js';
import type { ProductName } from '../value-objects/product/product-name.js';
import type { ProductPrice } from '../value-objects/product/product-price.js';
import type { ReferenceId } from '../value-objects/shared/reference-id.js';

export class Product {
  private constructor(
    private name: ProductName,
    private price: ProductPrice,
    private description: ProductDescription,
    private categoryId: ReferenceId,
    private available: boolean,
    private imageUrl: ProductImageUrl | null,
    private id: string | undefined,
  ) {}

  public static create(
    name: ProductName,
    price: ProductPrice,
    description: ProductDescription,
    categoryId: ReferenceId,
    available: boolean = true,
    imageUrl: ProductImageUrl | null = null,
    id?: string,
  ): Product {
    return new Product(name, price, description, categoryId, available, imageUrl, id);
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

  public getPrice(): string {
    return this.price.getValue().getValue();
  }

  public getImageUrl(): string | null {
    return this.imageUrl?.getValue() ?? null;
  }

  public isAvailable(): boolean {
    return this.available;
  }

  public isUnavailable(): boolean {
    return this.available === false;
  }
}
