import type { Addition } from '../../../domain/entities/addition.js';
import { Product } from '../../../domain/entities/product.js';
import { DomainError } from '../../../domain/errors/domain-error.js';
import type { AdditionRepository } from '../../../domain/repositories/addition-repository.js';
import type { CategoryRepository } from '../../../domain/repositories/category-repository.js';
import type { ProductRepository } from '../../../domain/repositories/product-repository.js';
import { ProductDescription } from '../../../domain/value-objects/product/product-description.js';
import { ProductImageUrl } from '../../../domain/value-objects/product/product-image-url.js';
import { ProductName } from '../../../domain/value-objects/product/product-name.js';
import { ProductPrice } from '../../../domain/value-objects/product/product-price.js';
import { DecimalValue } from '../../../domain/value-objects/shared/decimal-value.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { UpdateProductInput, UpdateProductOutput } from '../../dtos/products/update-product-dto.js';
import { ApplicationError } from '../../errors/application-error.js';

export class UpdateProduct {
  public constructor(
    private products: ProductRepository,
    private additions: AdditionRepository,
    private categories: CategoryRepository,
  ) {}

  public async update(input: UpdateProductInput): Promise<UpdateProductOutput> {
    const productId: ReferenceId = ReferenceId.create(input.productId, 'productId');
    const currentProduct: Product | null = await this.products.findProductById(productId.getValue());

    if (!currentProduct) {
      throw new ApplicationError('productId', 'NOT_FOUND', 'O produto informado não foi encontrado.');
    }

    this.ensureHasChanges(input);

    const product: Product = this.buildUpdatedProduct(input, currentProduct);
    await this.ensureUniqueName(product, currentProduct);
    await this.ensureCategoryExists(product, currentProduct);

    const additions: Addition[] | undefined = await this.findAdditions(input.additionIds);
    await this.products.update(product, additions);

    return { id: productId.getValue() };
  }

  private ensureHasChanges(input: UpdateProductInput): void {
    const changes: Array<UpdateProductInput[keyof UpdateProductInput]> = [
      input.name,
      input.description,
      input.categoryId,
      input.price,
      input.imageUrl,
      input.available,
      input.additionIds,
    ];
    const hasChanges: boolean = changes.some((value) => value !== undefined);

    if (!hasChanges) {
      throw new DomainError('product', 'EMPTY', 'Informe pelo menos um campo para atualizar o produto.');
    }
  }

  private buildUpdatedProduct(input: UpdateProductInput, currentProduct: Product): Product {
    const nameValue: string = input.name === undefined ? currentProduct.getName() : input.name;
    const descriptionValue: string | null = input.description === undefined ? currentProduct.getDescription() : input.description;
    const categoryIdValue: string = input.categoryId === undefined ? currentProduct.getCategoryId() : input.categoryId;
    const priceValue: string = input.price === undefined ? currentProduct.getPrice() : input.price;
    const imageUrlValue: string | null = input.imageUrl === undefined ? currentProduct.getImageUrl() : input.imageUrl;

    const name: ProductName = ProductName.create(nameValue);
    const description: ProductDescription = ProductDescription.create(descriptionValue);
    const categoryId: ReferenceId = ReferenceId.create(categoryIdValue, 'categoryId');
    const price: ProductPrice = ProductPrice.create(DecimalValue.create(priceValue));
    const imageUrl: ProductImageUrl | null = imageUrlValue === null ? null : ProductImageUrl.create(imageUrlValue);

    if (input.available !== undefined && typeof input.available !== 'boolean') {
      throw new DomainError('available', 'INVALID_TYPE', 'A disponibilidade do produto deve ser um booleano.');
    }
    const available: boolean = input.available === undefined ? currentProduct.isAvailable() : input.available;
    const productId: string = currentProduct.getId();

    return Product.create(name, price, description, categoryId, available, imageUrl, productId);
  }

  private async ensureUniqueName(product: Product, currentProduct: Product): Promise<void> {
    const updatedName: string = product.getName();
    const currentName: string = currentProduct.getName();
    if (updatedName === currentName) return;

    const nameExists: boolean = await this.products.existsByName(updatedName);
    if (nameExists) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um produto cadastrado com esse nome.');
    }
  }

  private async ensureCategoryExists(product: Product, currentProduct: Product): Promise<void> {
    const updatedCategoryId: string = product.getCategoryId();
    const currentCategoryId: string = currentProduct.getCategoryId();
    if (updatedCategoryId === currentCategoryId) return;

    const categoryExists: boolean = await this.categories.existsById(updatedCategoryId);
    if (!categoryExists) {
      throw new ApplicationError('categoryId', 'NOT_FOUND', 'A categoria informada não foi encontrada.');
    }
  }

  private async findAdditions(value: unknown): Promise<Addition[] | undefined> {
    if (value === undefined) return undefined;

    const additionIds: string[] = this.validateAdditionIds(value);
    const additions: Addition[] = [];

    for (const additionId of additionIds) {
      const addition: Addition | null = await this.additions.findById(additionId);
      if (!addition) {
        throw new ApplicationError('additionIds', 'NOT_FOUND', `Adicional não encontrado: ${additionId}.`);
      }
      additions.push(addition);
    }

    return additions;
  }

  private validateAdditionIds(value: unknown): string[] {
    if (!Array.isArray(value)) {
      throw new DomainError('additionIds', 'INVALID_TYPE', 'Os IDs dos adicionais devem ser uma lista.');
    }

    const additionIds: string[] = [];
    for (const rawId of value) {
      const additionId: ReferenceId = ReferenceId.create(rawId, 'additionIds');
      additionIds.push(additionId.getValue());
    }

    const hasDuplicateIds: boolean = new Set(additionIds).size !== additionIds.length;
    if (hasDuplicateIds) {
      throw new DomainError('additionIds', 'DUPLICATE', 'O mesmo adicional não pode ser informado mais de uma vez.');
    }

    return additionIds;
  }
}
