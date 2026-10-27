import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';
import type { ReleaseTableOutput } from '../../application/dtos/tables/release-table-dto.js';
import type { Table } from '../../domain/entities/table.js';
import type { TableRepository } from '../../domain/repositories/table-repository.js';
import { OrderStatus } from '../../domain/value-objects/order/order-status.js';
import { TableReleasePolicy } from '../../domain/policies/table-release-policy.js';

type LockedTable = {
  status: 'FREE' | 'OCCUPIED';
  total_spent: Prisma.Decimal;
};

export class PrismaTableRepository implements TableRepository {
  public constructor(private prisma: PrismaClient) {}

  public async existsByNumber(number: number): Promise<boolean> {
    const table = await this.prisma.table.findFirst({
      where: { number, deletedAt: null },
      select: { id: true },
    });
    return table !== null;
  }

  public async archive(id: string): Promise<void> {
    const archived = await this.prisma.table.updateMany({
      where: { id, deletedAt: null, status: 'FREE' },
      data: { deletedAt: new Date() },
    });
    if (archived.count === 1) return;

    const table = await this.prisma.table.findUnique({
      where: { id },
      select: { status: true, deletedAt: true },
    });
    if (!table || table.deletedAt !== null) {
      throw new ApplicationError('tableId', 'NOT_FOUND', 'A mesa informada não foi encontrada.');
    }
    throw new ApplicationError('tableId', 'IN_USE', 'Libere a mesa antes de excluí-la.');
  }

  public async save(table: Table): Promise<string> {
    const status = table.getStatus();
    const data: Prisma.TableCreateInput = {
      number: table.getNumber(),
      status,
      totalSpent: table.getTotalSpent(),
    };

    if (status === 'OCCUPIED') {
      data.sessions = { create: {} };
    }

    try {
      const savedTable = await this.prisma.table.create({
        data,
        select: { id: true },
      });

      return savedTable.id;
    } catch (error) {
      const isUniqueConstraintViolation = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

      if (isUniqueConstraintViolation) {
        throw new ApplicationError('number', 'ALREADY_EXISTS', 'Já existe uma mesa cadastrada com esse número.');
      }

      throw error;
    }
  }

  public async release(id: string): Promise<ReleaseTableOutput> {
    return this.prisma.$transaction(async (tx) => {
      // A criação de pedidos bloqueia a mesma linha antes de alterar a mesa.
      const [table] = await tx.$queryRaw<LockedTable[]>`
        SELECT status, total_spent
        FROM "tables"
        WHERE id = ${id} AND deleted_at IS NULL
        FOR UPDATE
      `;
      if (table === undefined) {
        throw new ApplicationError('tableId', 'NOT_FOUND', 'A mesa informada não foi encontrada.');
      }
      // Evita consultas desnecessárias quando o estado já impede a liberação.
      const activeOrder =
        table.status === 'OCCUPIED'
          ? await tx.order.findFirst({
              where: { tableId: id, status: { in: OrderStatus.getActiveStatuses() } },
              select: { id: true },
            })
          : null;
      const openSession =
        table.status === 'OCCUPIED' && activeOrder === null
          ? await tx.tableSession.findFirst({
              where: { tableId: id, closedAt: null },
              select: { id: true },
            })
          : null;
      const decision = TableReleasePolicy.evaluate({
        status: table.status,
        hasActiveOrders: activeOrder !== null,
        openSessionId: openSession?.id ?? null,
      });
      if (!decision.allowed) {
        throw new ApplicationError('tableId', decision.code, decision.message);
      }

      const closedTotal = table.total_spent;
      await tx.tableSession.update({
        where: { id: decision.sessionId },
        data: { closedAt: new Date(), closedTotal },
      });

      const releasedTable = await tx.table.update({
        where: { id },
        data: { status: 'FREE', totalSpent: '0' },
        select: { id: true, totalSpent: true },
      });

      return {
        id: releasedTable.id,
        status: 'FREE',
        totalSpent: releasedTable.totalSpent.toString(),
        sessionId: decision.sessionId,
        closedTotal: closedTotal.toString(),
      };
    });
  }
}
