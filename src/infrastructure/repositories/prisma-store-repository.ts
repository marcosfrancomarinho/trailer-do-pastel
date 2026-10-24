import { PrismaClient } from '@prisma/client';
import type { StoreRepository, StoreState, StoreStatus } from '../../domain/repositories/store-repository.js';

export class PrismaStoreRepository implements StoreRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async getStatus(): Promise<StoreState> {
    const store = await this.prisma.store.findUnique({
      where: { id: 1 }, select: { status: true, updatedAt: true },
    });
    // Bancos existentes podem não conter o registro inicial da loja.
    // Cria somente quando ausente, preservando o status já configurado.
    const current = store ?? await this.prisma.store.upsert({
      where: { id: 1 },
      create: { id: 1, status: 'OPEN' },
      update: {},
      select: { status: true, updatedAt: true },
    });
    return { status: current.status, updatedAt: current.updatedAt.toISOString() };
  }

  public async setStatus(status: StoreStatus): Promise<StoreState> {
    const store = await this.prisma.store.upsert({
      where: { id: 1 },
      create: { id: 1, status },
      update: { status },
      select: { status: true, updatedAt: true },
    });
    return { status: store.status, updatedAt: store.updatedAt.toISOString() };
  }
}
