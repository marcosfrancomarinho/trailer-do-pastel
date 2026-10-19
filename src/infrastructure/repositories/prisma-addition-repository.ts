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
          price: addition.getPrice().getValue(),
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
}
