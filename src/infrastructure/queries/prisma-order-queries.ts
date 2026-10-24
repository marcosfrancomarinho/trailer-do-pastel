import { Prisma, PrismaClient } from '@prisma/client';
import type {
  PendingOrderAddition,
  PendingOrderItem,
  PendingOrderListItem,
} from '../../application/dtos/orders/list-pending-orders-dto.js';
import type { OrderDateRange } from '../../domain/value-objects/order/order-date-range.js';
import type { OrderHistoryListItem } from '../../application/dtos/orders/list-order-history-dto.js';
import type { PreparingOrderListItem } from '../../application/dtos/orders/list-preparing-orders-dto.js';
import type { OrderQueries } from '../../application/queries/order-queries.js';
import type { TrackOrderOutput } from '../../application/dtos/orders/track-order-dto.js';
import type { ListTableOrdersOutput, TableOrderListItem } from '../../application/dtos/tables/list-table-orders-dto.js';
import type { ClosedTableSessionListItem } from '../../application/dtos/tables/list-closed-table-sessions-dto.js';
import type { ListTableSessionsOutput } from '../../application/dtos/tables/list-table-sessions-dto.js';
import type { TableOrderQueries } from '../../application/queries/table-order-queries.js';

const orderItemSelect = {
  productId: true,
  productName: true,
  quantity: true,
  unitPrice: true,
  additions: {
    select: {
      additionId: true,
      quantity: true,
      unitPrice: true,
      addition: { select: { name: true } },
    },
  },
} satisfies Prisma.OrderItemSelect;

type SelectedOrderItem = Prisma.OrderItemGetPayload<{ select: typeof orderItemSelect }>;

const tableOrderSelect = {
  id: true,
  customerName: true,
  customerPhone: true,
  observation: true,
  tableId: true,
  status: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  items: { select: orderItemSelect },
} satisfies Prisma.OrderSelect;

type SelectedTableOrder = Prisma.OrderGetPayload<{ select: typeof tableOrderSelect }>;

export class PrismaOrderQueries implements OrderQueries, TableOrderQueries {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findClosedSessions(date?: string): Promise<ClosedTableSessionListItem[]> {
    // Horário comercial de Imperatriz/MA (UTC-03:00), com limite superior exclusivo.
    const start = date ? new Date(date + 'T03:00:00.000Z') : undefined;
    const end = start ? new Date(start.getTime() + 86_400_000) : undefined;
    const sessions = await this.prisma.tableSession.findMany({
      where: {
        closedAt: { not: null, ...(start && end ? { gte: start, lt: end } : {}) },
      },
      select: {
        id: true,
        openedAt: true,
        closedAt: true,
        closedTotal: true,
        tableId: true,
        table: { select: { number: true } },
        orders: { select: tableOrderSelect, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
      },
      orderBy: [{ closedAt: 'desc' }, { id: 'desc' }],
    });

    const onlineOrders = await this.prisma.order.findMany({
      where: {
        tableId: null,
        tableSessionId: null,
        status: { in: ['COMPLETED', 'CANCELED'] },
        ...(start && end ? { updatedAt: { gte: start, lt: end } } : {}),
      },
      select: tableOrderSelect,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    const tableComandas: ClosedTableSessionListItem[] = sessions.map(session => ({
      tableId: session.tableId,
      tableNumber: session.table.number,
      origin: 'TABLE',
      session: {
        id: session.id,
        openedAt: session.openedAt.toISOString(),
        closedAt: session.closedAt?.toISOString() ?? null,
        closedTotal: session.closedTotal?.toString() ?? null,
        orders: session.orders.map(order => this.mapTableOrder(order)),
      },
    }));

    const onlineComandas: ClosedTableSessionListItem[] = onlineOrders.map(order => ({
      tableId: null,
      tableNumber: null,
      origin: 'ONLINE',
      session: {
        id: order.id,
        openedAt: order.createdAt.toISOString(),
        closedAt: order.updatedAt.toISOString(),
        closedTotal: order.status === 'COMPLETED' ? order.total.toString() : '0',
        orders: [this.mapTableOrder(order)],
      },
    }));

    return [...tableComandas, ...onlineComandas].sort((a, b) =>
      (b.session.closedAt ?? '').localeCompare(a.session.closedAt ?? '') ||
      b.session.id.localeCompare(a.session.id));
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
              select: tableOrderSelect,
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
      orders: (table.sessions[0]?.orders ?? []).map((order) => this.mapTableOrder(order)),
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
            orders: { select: tableOrderSelect, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
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
        orders: session.orders.map((order) => this.mapTableOrder(order)),
      })),
    };
  }

  private mapTableOrder(order: SelectedTableOrder): TableOrderListItem {
    return {
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      observation: order.observation,
      tableId: order.tableId,
      status: order.status,
      total: order.total.toString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: this.mapItems(order.items),
    };
  }

  public async findByTrackingToken(trackingToken: string): Promise<TrackOrderOutput | null> {
    const order = await this.prisma.order.findUnique({
      where: { trackingToken },
      select: { status: true, updatedAt: true },
    });

    if (!order) return null;

    return {
      status: order.status,
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  public async findPending(range?: OrderDateRange): Promise<PendingOrderListItem[]> {
    const dateRange = range?.getValue();
    const orders = await this.prisma.order.findMany({
      where: { status: 'PENDING', ...(dateRange ? { createdAt: { gte: dateRange.start, lt: dateRange.end } } : {}) },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        observation: true,
        tableId: true,
        table: { select: { number: true } },
        status: true,
        total: true,
        createdAt: true,
        items: { select: orderItemSelect },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const pendingOrders: PendingOrderListItem[] = [];

    for (const order of orders) {
      pendingOrders.push({
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        observation: order.observation,
        tableId: order.tableId,
        tableNumber: order.table?.number ?? null,
        status: 'PENDING',
        total: order.total.toString(),
        createdAt: order.createdAt.toISOString(),
        items: this.mapItems(order.items),
      });
    }

    return pendingOrders;
  }

  public async findHistory(range?: OrderDateRange): Promise<OrderHistoryListItem[]> {
    const dateRange = range?.getValue();
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['COMPLETED', 'CANCELED'] },
        ...(dateRange ? { createdAt: { gte: dateRange.start, lt: dateRange.end } } : {}),
      },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        observation: true,
        tableId: true,
        table: { select: { number: true } },
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        items: { select: orderItemSelect },
        histories: {
          select: { status: true, changedAt: true },
          orderBy: [{ changedAt: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    return orders.map((order) => ({
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      observation: order.observation,
      tableId: order.tableId,
      tableNumber: order.table?.number ?? null,
      status: order.status as 'COMPLETED' | 'CANCELED',
      total: order.total.toString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: this.mapItems(order.items),
      histories: order.histories.map((history) => ({
        status: history.status,
        changedAt: history.changedAt.toISOString(),
      })),
    }));
  }

  public async findPreparing(range?: OrderDateRange): Promise<PreparingOrderListItem[]> {
    const dateRange = range?.getValue();
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING'] },
        ...(dateRange ? { createdAt: { gte: dateRange.start, lt: dateRange.end } } : {}),
      },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        observation: true,
        tableId: true,
        table: { select: { number: true } },
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        items: { select: orderItemSelect },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return orders.map((order) => ({
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      observation: order.observation,
      tableId: order.tableId,
      tableNumber: order.table?.number ?? null,
      status: order.status as 'CONFIRMED' | 'PREPARING',
      total: order.total.toString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: this.mapItems(order.items),
    }));
  }

  private mapItems(orderItems: SelectedOrderItem[]): PendingOrderItem[] {
    return orderItems.map((item) => {
      const additions: PendingOrderAddition[] = item.additions.map((addition) => ({
        additionId: addition.additionId,
        additionName: addition.addition.name,
        quantity: addition.quantity,
        unitPrice: addition.unitPrice.toString(),
      }));

      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        additions,
      };
    });
  }
}
