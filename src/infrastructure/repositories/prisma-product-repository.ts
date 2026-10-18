import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';
import { Product } from '../../domain/entities/product.js';
import type { ProductRepository } from '../../domain/repositories/product-repository.js';
import { ProductName } from '../../domain/value-objects/product/product-name.js';
import { ProductPrice } from '../../domain/value-objects/product/product-price.js';
import { ProductDescription } from '../../domain/value-objects/product/product-description.js';
import { ProductCreatedAt } from '../../domain/value-objects/product/product-created-at.js';
import { DecimalValue } from '../../domain/value-objects/shared/decimal-value.js';

export class PrismaProductRepository implements ProductRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findProductById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) return null;

    const name = ProductName.create(product.name);
    const price = ProductPrice.create(DecimalValue.create(product.price.toString()));
    const description = product.description === null ? null : ProductDescription.create(product.description);
    const createdAt = ProductCreatedAt.restore(product.createdAt);

    return Product.create(name, price, description, createdAt, product.available, product.id);
  }

  public async existsByName(name: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { name },
      select: { id: true },
    });

    return product !== null;
  }

  public async save(product: Product): Promise<string> {
    try {
      const savedProduct = await this.prisma.product.create({
        data: {
          name: product.getName(),
          description: product.getDescription(),
          price: product.getPrice().getValue(),
          available: product.isAvailable(),
          createdAt: product.getCreatedAt(),
        },
        select: { id: true },
      });

      return savedProduct.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um produto cadastrado com esse nome.');
      }

      throw error;
    }
  }
}
