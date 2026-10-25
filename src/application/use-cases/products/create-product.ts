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
import type { CreateProductInput, CreateProductOutput } from '../../dtos/products/create-product-dto.js';
import { ApplicationError } from '../../errors/application-error.js';

export class CreateProduct {
  public constructor(
    private productRepository: ProductRepository,
    private additionRepository: AdditionRepository,
    private categoryRepository: CategoryRepository,
  ) {}

  public async create(input: CreateProductInput): Promise<CreateProductOutput> {
    const name = ProductName.create(input.name);
    const productExists = await this.productRepository.existsByName(name.getValue());

    if (productExists) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um produto cadastrado com esse nome.');
    }

    const categoryId = ReferenceId.create(input.categoryId, 'categoryId');
    const categoryExists = await this.categoryRepository.existsById(categoryId.getValue());

    if (!categoryExists) {
      throw new ApplicationError('categoryId', 'NOT_FOUND', 'A categoria informada não foi encontrada.');
    }

    const price = ProductPrice.create(DecimalValue.create(input.price));
    const description = ProductDescription.create(input.description);
    const imageUrl = input.imageUrl != null ? ProductImageUrl.create(input.imageUrl) : null;

    const product = Product.create(name, price, description, categoryId, input.available, imageUrl);

    const additionIds = this.validateAdditionIds(input.additionIds);
    const additions: Addition[] = [];

    for (const additionId of additionIds) {
      const addition = await this.additionRepository.findAdditionById(additionId);
      if (!addition) {
        throw new ApplicationError('additionIds', 'NOT_FOUND', `Adicional não encontrado: ${additionId}.`);
      }
      additions.push(addition);
    }
    const id = await this.productRepository.save(product, additions);

    return { id };
  }

  private validateAdditionIds(value: unknown): string[] {
    if (value === undefined) {
      return [];
    }

    if (!Array.isArray(value)) {
      throw new DomainError('additionIds', 'INVALID_TYPE', 'Os IDs dos adicionais devem ser uma lista.');
    }

    const additionIds = value.map((rawId) => {
      const additionId = ReferenceId.create(rawId, 'additionIds');
      return additionId.getValue();
    });

    const uniqueAdditionIds = new Set(additionIds);
    if (uniqueAdditionIds.size < additionIds.length) {
      throw new DomainError('additionIds', 'DUPLICATE', 'O mesmo adicional não pode ser informado mais de uma vez.');
    }

    return additionIds;
  }
}
