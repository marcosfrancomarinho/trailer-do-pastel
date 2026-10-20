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
    const productId = ReferenceId.create(input.productId, 'productId');
    const currentProduct = await this.productRepository.findProductById(productId.getValue());

    if (!currentProduct) {
      throw new ApplicationError('productId', 'NOT_FOUND', 'O produto informado não foi encontrado.');
    }

    this.ensureHasChanges(input);

    const product = this.buildUpdatedProduct(input, currentProduct);
    await this.ensureUniqueName(product, currentProduct);
    await this.ensureCategoryExists(product, currentProduct);

    const additions = await this.findAdditions(input.additionIds);
    await this.productRepository.update(product, additions);

    return { id: productId.getValue() };
  }

  private ensureHasChanges(input: UpdateProductInput): void {
    const changes = [input.name, input.description, input.categoryId, input.price, input.available, input.additionIds];
    if (changes.every((value) => value === undefined)) {
      throw new DomainError('product', 'EMPTY', 'Informe pelo menos um campo para atualizar o produto.');
    }
  }

  private buildUpdatedProduct(input: UpdateProductInput, currentProduct: Product): Product {
    const name = ProductName.create(input.name === undefined ? currentProduct.getName() : input.name);
    const description = ProductDescription.create(
      input.description === undefined ? currentProduct.getDescription() : input.description,
    );
    const categoryId = ReferenceId.create(
      input.categoryId === undefined ? currentProduct.getCategoryId() : input.categoryId,
      'categoryId',
    );
    const priceValue = input.price === undefined ? currentProduct.getPrice().getValue() : input.price;
    const price = ProductPrice.create(DecimalValue.create(priceValue));

    if (input.available !== undefined && typeof input.available !== 'boolean') {
      throw new DomainError('available', 'INVALID_TYPE', 'A disponibilidade do produto deve ser um booleano.');
    }
    const available = input.available === undefined ? currentProduct.isAvailable() : input.available;

    return Product.create(name, price, description, categoryId, available, currentProduct.getId());
  }

  private async ensureUniqueName(product: Product, currentProduct: Product): Promise<void> {
    if (product.getName() === currentProduct.getName()) return;

    if (await this.productRepository.existsByName(product.getName())) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um produto cadastrado com esse nome.');
    }
  }

  private async ensureCategoryExists(product: Product, currentProduct: Product): Promise<void> {
    if (product.getCategoryId() === currentProduct.getCategoryId()) return;

    if (!(await this.categoryRepository.existsById(product.getCategoryId()))) {
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

    const additionIds = value.map((rawId) => ReferenceId.create(rawId, 'additionIds').getValue());

    if (new Set(additionIds).size !== additionIds.length) {
      throw new DomainError('additionIds', 'DUPLICATE', 'O mesmo adicional não pode ser informado mais de uma vez.');
    }

    return additionIds;
  }
}
