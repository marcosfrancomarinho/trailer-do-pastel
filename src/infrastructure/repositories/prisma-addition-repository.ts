import { Prisma, PrismaClient } from '@prisma/client';
import type { Addition as PrismaAddition } from '@prisma/client';
import { InfrastructureError } from '../errors/infrastructure-error.js';
import { Addition } from '../../domain/entities/addition.js';
import type { AdditionRepository } from '../../domain/repositories/addition-repository.js';
import { AdditionName } from '../../domain/value-objects/addition/addition-name.js';
import { AdditionPrice } from '../../domain/value-objects/addition/addition-price.js';
import { DecimalValue } from '../../domain/value-objects/shared/decimal-value.js';

export class PrismaAdditionRepository implements AdditionRepository {
  public constructor(private prisma: PrismaClient) {}

  public async findById(id: string): Promise<Addition | null> {
    const addition = await this.prisma.addition.findFirst({ where: { id, deletedAt: null } });

    if (!addition) return null;

    const name = AdditionName.create(addition.name);
    const price = AdditionPrice.create(DecimalValue.create(addition.price.toString()));
    return Addition.create(name, price, addition.available, addition.id);
  }

  public async isLinkedToProduct(productId: string, additionId: string): Promise<boolean> {
    const link = await this.prisma.productAddition.findUnique({
      where: {
        productId_additionId: { productId, additionId },
      },
      select: { productId: true },
    });

    return link !== null;
  }

  public async existsByName(name: string): Promise<boolean> {
    const addition = await this.prisma.addition.findUnique({
      where: { name },
      select: { id: true },
    });

    return addition !== null;
  }

  public async findByName(name: string): Promise<Addition | null> {
    const addition: PrismaAddition | null = await this.prisma.addition.findUnique({ where: { name } });

    if (!addition) return null;

    const additionName: AdditionName = AdditionName.create(addition.name);
    const price: AdditionPrice = AdditionPrice.create(DecimalValue.create(addition.price.toString()));
    return Addition.create(additionName, price, addition.available, addition.id, addition.deletedAt);
  }

  public async save(addition: Addition): Promise<string> {
    try {
      const created = await this.prisma.addition.create({
        data: {
          name: addition.getName(),
          price: addition.getPrice(),
          available: addition.isAvailable(),
        },
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new InfrastructureError('name', 'ALREADY_EXISTS', 'Já existe um adicional cadastrado com esse nome.');
      }
      throw error;
    }
  }

  public async reactivate(id: string, addition: Addition): Promise<string> {
    const result = await this.prisma.addition.updateMany({
      where: { id, deletedAt: { not: null } },
      data: {
        price: addition.getPrice(),
        available: addition.isAvailable(),
        deletedAt: null,
      },
    });

    if (result.count !== 1) {
      throw new InfrastructureError('name', 'ALREADY_EXISTS', 'Já existe um adicional cadastrado com esse nome.');
    }

    return id;
  }

  public async update(addition: Addition): Promise<void> {
    try {
      await this.prisma.addition.update({
        where: { id: addition.getId() },
        data: {
          name: addition.getName(),
          price: addition.getPrice(),
          available: addition.isAvailable(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new InfrastructureError('name', 'ALREADY_EXISTS', 'Já existe um adicional cadastrado com esse nome.');
        }

        if (error.code === 'P2025') {
          throw new InfrastructureError('additionId', 'NOT_FOUND', 'O adicional informado não foi encontrado.');
        }
      }

      throw error;
    }
  }

  public async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.addition.update({ where: { id }, data: { deletedAt: new Date(), available: false } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new InfrastructureError('additionId', 'NOT_FOUND', 'O adicional informado não foi encontrado.');
        }
      }

      throw error;
    }
  }
}
