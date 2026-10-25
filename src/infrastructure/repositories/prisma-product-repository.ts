import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';
import { Product } from '../../domain/entities/product.js';
import type { Addition } from '../../domain/entities/addition.js';
import type { ProductRepository } from '../../domain/repositories/product-repository.js';
import { ProductName } from '../../domain/value-objects/product/product-name.js';
import { ProductImageUrl } from '../../domain/value-objects/product/product-image-url.js';
import { ProductPrice } from '../../domain/value-objects/product/product-price.js';
import { ProductDescription } from '../../domain/value-objects/product/product-description.js';
import { DecimalValue } from '../../domain/value-objects/shared/decimal-value.js';
import { ReferenceId } from '../../domain/value-objects/shared/reference-id.js';

export class PrismaProductRepository implements ProductRepository {
  public constructor(private prisma: PrismaClient) {}

  public async findProductById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) return null;

    const name = ProductName.create(product.name);
    const price = ProductPrice.create(DecimalValue.create(product.price.toString()));
    const description = ProductDescription.create(product.description);
    const categoryId = ReferenceId.create(product.categoryId, 'categoryId');
    const imageUrl = product.imageUrl === null ? null : ProductImageUrl.create(product.imageUrl);
    return Product.create(name, price, description, categoryId, product.available, imageUrl, product.id);
  }

  public async existsById(id: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    return product !== null;
  }

  public async existsByName(name: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { name },
      select: { id: true },
    });

    return product !== null;
  }

  public async save(product: Product, additions: Addition[]): Promise<string> {
    try {
      const data: Prisma.ProductUncheckedCreateInput = {
        name: product.getName(),
        description: product.getDescription(),
        categoryId: product.getCategoryId(),
        price: product.getPrice(),
        imageUrl: product.getImageUrl(),
        available: product.isAvailable()
      };

      if (additions.length > 0) {
        const additionLinks = additions.map((addition) => ({ additionId: addition.getId() }));
        data.additions = { create: additionLinks };
      }

      const { id } = await this.prisma.product.create({
        data,
        select: { id: true },
      });

      return id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um produto cadastrado com esse nome.');
      }
      throw error;
    }
  }

  public async update(product: Product, additions?: Addition[]): Promise<void> {
    const data: Prisma.ProductUncheckedUpdateInput = {
      name: product.getName(),
      description: product.getDescription(),
      categoryId: product.getCategoryId(),
      price: product.getPrice(),
      imageUrl: product.getImageUrl(),
      available: product.isAvailable(),
    };

    try {
      await this.prisma.$transaction(async (transaction) => {
        const productId = product.getId();
        await transaction.product.update({
          where: { id: productId },
          data,
          select: { id: true },
        });

        if (additions === undefined) return;

        await transaction.productAddition.deleteMany({ where: { productId } });
        if (additions.length === 0) return;

        await transaction.productAddition.createMany({
          data: additions.map((addition) => ({ productId, additionId: addition.getId() })),
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um produto cadastrado com esse nome.');
        }
        if (error.code === 'P2025') {
          throw new ApplicationError('productId', 'NOT_FOUND', 'O produto informado não foi encontrado.');
        }
        if (error.code === 'P2003') {
          throw new ApplicationError('product', 'NOT_FOUND', 'Categoria ou adicional não encontrado.');
        }
      }
      throw error;
    }
  }

  public async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ApplicationError('productId', 'IN_USE', 'O produto não pode ser excluído porque já está em um pedido.');
      }

      throw error;
    }
  }
}
