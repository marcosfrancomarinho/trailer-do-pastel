import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';
import type { Table } from '../../domain/entities/table.js';
import type { TableRepository } from '../../domain/repositories/table-repository.js';

export class PrismaTableRepository implements TableRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async existsByNumber(number: number): Promise<boolean> {
    const table = await this.prisma.table.findUnique({
      where: { number },
      select: { id: true },
    });
    return table !== null;
  }

  public async save(table: Table): Promise<string> {
    try {
      const savedTable = await this.prisma.table.create({
        data: {
          number: table.getNumber(), status: table.getStatus(), totalSpent: table.getTotalSpent(),
          ...(table.getStatus() === 'OCCUPIED' ? { sessions: { create: {} } } : {}),
        },
        select: { id: true },
      });
      return savedTable.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApplicationError('number', 'ALREADY_EXISTS', 'Já existe uma mesa cadastrada com esse número.');
      }
      throw error;
    }
  }

  public async release(id: string): Promise<{
    id: string; status: 'FREE'; totalSpent: string; sessionId: string; closedTotal: string;
  }> {
    return this.prisma.$transaction(async (tx) => {
      // A criação de pedidos também atualiza esta linha antes de inserir o pedido.
      // O bloqueio mantém a conferência e a liberação na mesma ocupação da mesa.
      const rows = await tx.$queryRaw<Array<{ id: string; status: string; total_spent: Prisma.Decimal }>>`
        SELECT id, status, total_spent FROM "tables" WHERE id = ${id} FOR UPDATE
      `;
      const table = rows[0];
      if (!table) {
        throw new ApplicationError('tableId', 'NOT_FOUND', 'A mesa informada não foi encontrada.');
      }
      if (table.status === 'FREE') {
        throw new ApplicationError('tableId', 'UNAVAILABLE', 'A mesa já está livre.');
      }

      const activeOrders = await tx.order.count({
        where: { tableId: id, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } },
      });
      if (activeOrders > 0) {
        throw new ApplicationError('tableId', 'IN_USE', 'A mesa possui pedidos em andamento.');
      }

      const session = await tx.tableSession.findFirst({
        where: { tableId: id, closedAt: null },
        select: { id: true },
      });
      if (session === null) {
        throw new ApplicationError('tableId', 'IN_USE', 'A mesa ocupada não possui uma comanda aberta.');
      }

      await tx.tableSession.update({
        where: { id: session.id },
        data: { closedAt: new Date(), closedTotal: table.total_spent },
      });

      const released = await tx.table.update({
        where: { id },
        data: { status: 'FREE', totalSpent: '0' },
        select: { id: true, totalSpent: true },
      });
      return {
        id: released.id, status: 'FREE', totalSpent: released.totalSpent.toString(),
        sessionId: session.id, closedTotal: table.total_spent.toString(),
      };
    });
  }
}
