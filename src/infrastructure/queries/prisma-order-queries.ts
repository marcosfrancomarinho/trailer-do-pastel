import { PrismaClient } from '@prisma/client';
import type { PendingOrderListItem } from '../../application/dtos/orders/list-pending-orders-dto.js';
import type { OrderDateRange } from '../../domain/value-objects/order/order-date-range.js';
import type { OrderHistoryListItem } from '../../application/dtos/orders/list-order-history-dto.js';
import type { PreparingOrderListItem } from '../../application/dtos/orders/list-preparing-orders-dto.js';
import type { OrderQueries } from '../../application/queries/order-queries.js';
import type { TrackOrderOutput } from '../../application/dtos/orders/track-order-dto.js';
import { OrderItemMap } from '../map/order-item-map.js';

export class PrismaOrderQueries implements OrderQueries {
  public constructor(private prisma: PrismaClient) {}

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
        items: { select: OrderItemMap.select },
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
        items: OrderItemMap.map(order.items),
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
        tableSession: { select: { table: { select: { number: true } } } },
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        items: { select: OrderItemMap.select },
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
      tableNumber: order.table?.number ?? order.tableSession?.table.number ?? null,
      status: order.status as 'COMPLETED' | 'CANCELED',
      total: order.total.toString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: OrderItemMap.map(order.items),
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
        items: { select: OrderItemMap.select },
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
      items: OrderItemMap.map(order.items),
    }));
  }
}
