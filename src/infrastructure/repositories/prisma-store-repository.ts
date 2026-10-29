import { Prisma, PrismaClient, type Store as PrismaStore } from '@prisma/client';
import { StoreState, type StoreStatus } from '../../domain/entities/store-state.js';
import type { StoreRepository } from '../../domain/repositories/store-repository.js';

type StoreStatusRecord = Pick<PrismaStore, 'status' | 'updatedAt'>;

export class PrismaStoreRepository implements StoreRepository {
  public constructor(private prisma: PrismaClient) {}

  public async getStatus(): Promise<StoreState> {
    let store: StoreStatusRecord;
    try {
      store = await this.prisma.store.upsert({
        where: { id: 1 },
        create: { id: 1, status: 'OPEN' },
        update: {},
        select: { status: true, updatedAt: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing: StoreStatusRecord | null = await this.prisma.store.findUnique({
          where: { id: 1 },
          select: { status: true, updatedAt: true },
        });
        if (existing !== null) {
          store = existing;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
    return StoreState.create(store.status, store.updatedAt);
  }

  public async setStatus(status: StoreStatus): Promise<StoreState> {
    const store: StoreStatusRecord = await this.prisma.store.upsert({
      where: { id: 1 },
      create: { id: 1, status },
      update: { status },
      select: { status: true, updatedAt: true },
    });
    return StoreState.create(store.status, store.updatedAt);
  }
}
