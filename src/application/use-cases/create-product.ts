import { Product } from '../../domain/entities/product.js';
import { DecimalValue } from '../../domain/value-objects/shared/decimal-value.js';
import type { ProductRepository } from '../../domain/repositories/product-repository.js';
import { ProductDescription } from '../../domain/value-objects/product/product-description.js';
import { ProductName } from '../../domain/value-objects/product/product-name.js';
import { ProductPrice } from '../../domain/value-objects/product/product-price.js';
import { ReferenceId } from '../../domain/value-objects/shared/reference-id.js';
import type { CreateProductInput, CreateProductOutput } from '../dtos/create-product-dto.js';
import { ApplicationError } from '../errors/application-error.js';

export class CreateProduct {
  public constructor(private readonly productRepository: ProductRepository) {}

  public async create(input: CreateProductInput): Promise<CreateProductOutput> {
    const name = ProductName.create(input.name);
    const productExists = await this.productRepository.existsByName(name.getValue());

    if (productExists) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um produto cadastrado com esse nome.');
    }

    const decimalPrice = DecimalValue.create(input.price);
    const price = ProductPrice.create(decimalPrice);
    const description = ProductDescription.create(input.description);
    const categoryId = ReferenceId.create(input.categoryId, 'categoryId');
    const product = Product.create(name, price, description, categoryId, input.available);

    const id = await this.productRepository.save(product);

    return { id };
  }
}
