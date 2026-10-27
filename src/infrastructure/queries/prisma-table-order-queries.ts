import { Prisma, PrismaClient } from '@prisma/client';
import type { ClosedTableSessionListItem } from '../../application/dtos/tables/list-closed-table-sessions-dto.js';
import type { ListTableOrdersOutput } from '../../application/dtos/tables/list-table-orders-dto.js';
import type { ListTableSessionsOutput } from '../../application/dtos/tables/list-table-sessions-dto.js';
import type { TableOrderQueries } from '../../application/queries/table-order-queries.js';
import { TableOrderMap } from '../map/table-order-map.js';

export class PrismaTableOrderQueries implements TableOrderQueries {
  public constructor(private prisma: PrismaClient) {}

  public async findClosedSessions(date: string): Promise<ClosedTableSessionListItem[]> {
    // Horário comercial de Imperatriz/MA (UTC-03:00), com limite superior exclusivo.
    const dayStartUtc = new Date(`${date}T03:00:00.000Z`);
    const nextDayStartUtc = new Date(dayStartUtc.getTime() + 86_400_000);

    const sessionWhere: Prisma.TableSessionWhereInput = {
      closedAt: { not: null, gte: dayStartUtc, lt: nextDayStartUtc },
    };
    const onlineOrderWhere: Prisma.OrderWhereInput = {
      tableId: null,
      tableSessionId: null,
      status: { in: ['COMPLETED', 'CANCELED'] },
      updatedAt: { gte: dayStartUtc, lt: nextDayStartUtc },
    };

    const sessions = await this.prisma.tableSession.findMany({
      where: sessionWhere,
      select: {
        id: true,
        openedAt: true,
        closedAt: true,
        closedTotal: true,
        tableId: true,
        table: { select: { number: true } },
        orders: { select: TableOrderMap.select, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
      },
      orderBy: [{ closedAt: 'desc' }, { id: 'desc' }],
    });

    const onlineOrders = await this.prisma.order.findMany({
      where: onlineOrderWhere,
      select: TableOrderMap.select,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    const tableComandas: ClosedTableSessionListItem[] = sessions.map((session) => ({
      tableId: session.tableId,
      tableNumber: session.table.number,
      origin: 'TABLE',
      session: {
        id: session.id,
        openedAt: session.openedAt.toISOString(),
        closedAt: session.closedAt?.toISOString() ?? null,
        closedTotal: session.closedTotal?.toString() ?? null,
        orders: session.orders.map((order) => TableOrderMap.map(order)),
      },
    }));

    const onlineComandas: ClosedTableSessionListItem[] = onlineOrders.map((order) => ({
      tableId: null,
      tableNumber: null,
      origin: 'ONLINE',
      session: {
        id: order.id,
        openedAt: order.createdAt.toISOString(),
        closedAt: order.updatedAt.toISOString(),
        closedTotal: order.status === 'COMPLETED' ? order.total.toString() : '0',
        orders: [TableOrderMap.map(order)],
      },
    }));

    const comandas = [...tableComandas, ...onlineComandas];

    comandas.sort((first, second) => {
      const firstClosedAt = first.session.closedAt ?? '';
      const secondClosedAt = second.session.closedAt ?? '';
      const byClosingDate = secondClosedAt.localeCompare(firstClosedAt);

      if (byClosingDate !== 0) {
        return byClosingDate;
      }

      return second.session.id.localeCompare(first.session.id);
    });
    return comandas;
  }

  public async findByTableId(tableId: string): Promise<ListTableOrdersOutput | null> {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: {
        id: true,
        number: true,
        status: true,
        totalSpent: true,
        sessions: {
          where: { closedAt: null },
          take: 1,
          select: {
            id: true,
            orders: {
              where: { tableId, status: { not: 'CANCELED' } },
              select: TableOrderMap.select,
              orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            },
          },
        },
      },
    });

    if (table === null) return null;

    return {
      tableId: table.id,
      number: table.number,
      status: table.status,
      totalSpent: table.totalSpent.toString(),
      sessionId: table.sessions[0]?.id ?? null,
      orders: (table.sessions[0]?.orders ?? []).map((order) => TableOrderMap.map(order)),
    };
  }

  public async findSessionsByTableId(tableId: string): Promise<ListTableSessionsOutput | null> {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: {
        id: true,
        sessions: {
          select: {
            id: true,
            openedAt: true,
            closedAt: true,
            closedTotal: true,
            orders: { select: TableOrderMap.select, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
          },
          orderBy: [{ openedAt: 'desc' }, { id: 'desc' }],
        },
      },
    });
    if (table === null) return null;

    return {
      tableId: table.id,
      sessions: table.sessions.map((session) => ({
        id: session.id,
        openedAt: session.openedAt.toISOString(),
        closedAt: session.closedAt?.toISOString() ?? null,
        closedTotal: session.closedTotal?.toString() ?? null,
        orders: session.orders.map((order) => TableOrderMap.map(order)),
      })),
    };
  }
}
