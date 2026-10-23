import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';
import { Addition } from '../../domain/entities/addition.js';
import type { AdditionRepository } from '../../domain/repositories/addition-repository.js';
import { AdditionName } from '../../domain/value-objects/addition/addition-name.js';
import { AdditionPrice } from '../../domain/value-objects/addition/addition-price.js';
import { DecimalValue } from '../../domain/value-objects/shared/decimal-value.js';

export class PrismaAdditionRepository implements AdditionRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAdditionById(id: string): Promise<Addition | null> {
    const addition = await this.prisma.addition.findUnique({ where: { id } });

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

  public async save(addition: Addition): Promise<string> {
    try {
      const savedAddition = await this.prisma.addition.create({
        data: {
          name: addition.getName(),
          price: addition.getPrice(),
          available: addition.isAvailable(),
        },
        select: { id: true },
      });

      return savedAddition.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um adicional cadastrado com esse nome.');
      }

      throw error;
    }
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
          throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um adicional cadastrado com esse nome.');
        }

        if (error.code === 'P2025') {
          throw new ApplicationError('additionId', 'NOT_FOUND', 'O adicional informado não foi encontrado.');
        }
      }

      throw error;
    }
  }

  public async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.addition.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError('additionId', 'NOT_FOUND', 'O adicional informado não foi encontrado.');
        }

        if (error.code === 'P2003') {
          throw new ApplicationError('additionId', 'IN_USE', 'O adicional não pode ser excluído porque já está em um pedido.');
        }
      }

      throw error;
    }
  }
}
