import type { Addition } from '../../../domain/entities/addition.js';
import { Product } from '../../../domain/entities/product.js';
import { DomainError } from '../../../domain/errors/domain-error.js';
import type { AdditionRepository } from '../../../domain/repositories/addition-repository.js';
import type { CategoryRepository } from '../../../domain/repositories/category-repository.js';
import type { ProductRepository } from '../../../domain/repositories/product-repository.js';
import { ProductDescription } from '../../../domain/value-objects/product/product-description.js';
import { ProductName } from '../../../domain/value-objects/product/product-name.js';
import { ProductPrice } from '../../../domain/value-objects/product/product-price.js';
import { DecimalValue } from '../../../domain/value-objects/shared/decimal-value.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { UpdateProductInput, UpdateProductOutput } from '../../dtos/update-product-dto.js';
import { ApplicationError } from '../../errors/application-error.js';

export class UpdateProduct {
  public constructor(
    private readonly productRepository: ProductRepository,
    private readonly additionRepository: AdditionRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  public async update(input: UpdateProductInput): Promise<UpdateProductOutput> {
    const productId = ReferenceId.create(input.productId, 'productId').getValue();
    const currentProduct = await this.productRepository.findProductById(productId);

    if (!currentProduct) {
      throw new ApplicationError('productId', 'NOT_FOUND', 'O produto informado não foi encontrado.');
    }

    this.ensureHasChanges(input);

    const product = this.buildUpdatedProduct(input, currentProduct);
    await this.ensureUniqueName(product, currentProduct);
    await this.ensureCategoryExists(product, currentProduct);

    const additions = await this.findAdditions(input.additionIds);
    await this.productRepository.update(product, additions);

    return { id: productId };
  }

  private ensureHasChanges(input: UpdateProductInput): void {
    const changes = [input.name, input.description, input.categoryId, input.price, input.available, input.additionIds];
    const hasChanges = changes.some((value) => value !== undefined);

    if (!hasChanges) {
      throw new DomainError('product', 'EMPTY', 'Informe pelo menos um campo para atualizar o produto.');
    }
  }

  private buildUpdatedProduct(input: UpdateProductInput, currentProduct: Product): Product {
    const nameValue = input.name === undefined ? currentProduct.getName() : input.name;
    const descriptionValue = input.description === undefined ? currentProduct.getDescription() : input.description;
    const categoryIdValue = input.categoryId === undefined ? currentProduct.getCategoryId() : input.categoryId;
    const priceValue = input.price === undefined ? currentProduct.getPrice().getValue() : input.price;

    const name = ProductName.create(nameValue);
    const description = ProductDescription.create(descriptionValue);
    const categoryId = ReferenceId.create(categoryIdValue, 'categoryId');
    const decimalPrice = DecimalValue.create(priceValue);
    const price = ProductPrice.create(decimalPrice);

    if (input.available !== undefined && typeof input.available !== 'boolean') {
      throw new DomainError('available', 'INVALID_TYPE', 'A disponibilidade do produto deve ser um booleano.');
    }
    const available = input.available === undefined ? currentProduct.isAvailable() : input.available;
    const productId = currentProduct.getId();

    return Product.create(name, price, description, categoryId, available, productId);
  }

  private async ensureUniqueName(product: Product, currentProduct: Product): Promise<void> {
    const updatedName = product.getName();
    const currentName = currentProduct.getName();
    if (updatedName === currentName) return;

    const nameExists = await this.productRepository.existsByName(updatedName);
    if (nameExists) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um produto cadastrado com esse nome.');
    }
  }

  private async ensureCategoryExists(product: Product, currentProduct: Product): Promise<void> {
    const updatedCategoryId = product.getCategoryId();
    const currentCategoryId = currentProduct.getCategoryId();
    if (updatedCategoryId === currentCategoryId) return;

    const categoryExists = await this.categoryRepository.existsById(updatedCategoryId);
    if (!categoryExists) {
      throw new ApplicationError('categoryId', 'NOT_FOUND', 'A categoria informada não foi encontrada.');
    }
  }

  private async findAdditions(value: unknown): Promise<Addition[] | undefined> {
    if (value === undefined) return undefined;

    const additionIds = this.validateAdditionIds(value);
    const additions: Addition[] = [];

    for (const additionId of additionIds) {
      const addition = await this.additionRepository.findAdditionById(additionId);
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
      const additionId = ReferenceId.create(rawId, 'additionIds').getValue();
      additionIds.push(additionId);
    }

    const hasDuplicateIds = new Set(additionIds).size !== additionIds.length;
    if (hasDuplicateIds) {
      throw new DomainError('additionIds', 'DUPLICATE', 'O mesmo adicional não pode ser informado mais de uma vez.');
    }

    return additionIds;
  }
}
