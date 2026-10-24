import { PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';
import type { StoreRepository, StoreState, StoreStatus } from '../../domain/repositories/store-repository.js';

export class PrismaStoreRepository implements StoreRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async getStatus(): Promise<StoreState> {
    const store = await this.prisma.store.findUnique({
      where: { id: 1 }, select: { status: true, updatedAt: true },
    });
    if (store === null) {
      throw new ApplicationError('store', 'NOT_FOUND', 'O estado da loja não foi configurado.');
    }
    return { status: store.status, updatedAt: store.updatedAt.toISOString() };
  }

  public async setStatus(status: StoreStatus): Promise<StoreState> {
    const store = await this.prisma.store.update({
      where: { id: 1 }, data: { status }, select: { status: true, updatedAt: true },
    });
    return { status: store.status, updatedAt: store.updatedAt.toISOString() };
  }
}
