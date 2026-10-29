import { Prisma, PrismaClient } from '@prisma/client';
import type { Product as PrismaProduct } from '@prisma/client';
import { InfrastructureError } from '../errors/infrastructure-error.js';
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

  public async findById(id: string): Promise<Product | null> {
    try {
      const product: PrismaProduct | null = await this.prisma.product.findFirst({
        where: { id, deletedAt: null, category: { deletedAt: null } },
      });

      if (product === null) return null;

      const name: ProductName = ProductName.create(product.name);
      const price: ProductPrice = ProductPrice.create(DecimalValue.create(product.price.toString()));
      const description: ProductDescription = ProductDescription.create(product.description);
      const categoryId: ReferenceId = ReferenceId.create(product.categoryId, 'categoryId');
      const imageUrl: ProductImageUrl | null = product.imageUrl === null ? null : ProductImageUrl.create(product.imageUrl);
      return Product.create(name, price, description, categoryId, product.available, imageUrl, product.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientInitializationError) {
        throw new InfrastructureError('productId', 'CONNECTION_FAILED', 'Não foi possível conectar ao banco de dados.');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientUnknownRequestError) {
        throw new InfrastructureError('productId', 'PERSISTENCE_FAILED', 'Não foi possível buscar o produto.');
      }
      throw error;
    }
  }

  public async existsById(id: string): Promise<boolean> {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null, category: { deletedAt: null } },
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
    const name = product.getName();
    const conflict = () => new InfrastructureError('name', 'ALREADY_EXISTS', 'Já existe um produto cadastrado com esse nome.');
    const data = {
      description: product.getDescription(),
      categoryId: product.getCategoryId(),
      price: product.getPrice(),
      imageUrl: product.getImageUrl(),
      available: product.isAvailable(),
    };

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.product.findUnique({
          where: { name },
          select: { id: true, deletedAt: true },
        });
        if (existing) {
          if (existing.deletedAt === null) throw conflict();
          const restored = await transaction.product.updateMany({
            where: { id: existing.id, deletedAt: { not: null } },
            data: { ...data, deletedAt: null },
          });
          if (restored.count !== 1) throw conflict();

          // Replaces old catalog links, never historical order item links.
          await transaction.productAddition.deleteMany({ where: { productId: existing.id } });
          if (additions.length > 0) {
            await transaction.productAddition.createMany({
              data: additions.map((addition) => ({
                productId: existing.id,
                additionId: addition.getId(),
              })),
            });
          }
          return existing.id;
        }

        const created = await transaction.product.create({
          data: {
            name,
            ...data,
            additions: {
              create: additions.map((addition) => ({ additionId: addition.getId() })),
            },
          },
          select: { id: true },
        });
        return created.id;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw conflict();
        if (error.code === 'P2003') {
          throw new InfrastructureError('product', 'NOT_FOUND', 'Categoria ou adicional não encontrado.');
        }
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
          throw new InfrastructureError('name', 'ALREADY_EXISTS', 'Já existe um produto cadastrado com esse nome.');
        }
        if (error.code === 'P2025') {
          throw new InfrastructureError('productId', 'NOT_FOUND', 'O produto informado não foi encontrado.');
        }
        if (error.code === 'P2003') {
          throw new InfrastructureError('product', 'NOT_FOUND', 'Categoria ou adicional não encontrado.');
        }
      }
      throw error;
    }
  }

  public async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date(), available: false } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new InfrastructureError('productId', 'NOT_FOUND', 'O produto informado não foi encontrado.');
      }

      throw error;
    }
  }
}
