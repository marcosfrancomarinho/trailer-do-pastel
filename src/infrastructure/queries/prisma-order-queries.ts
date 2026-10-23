import { Prisma, PrismaClient } from '@prisma/client';
import type {
  PendingOrderAddition,
  PendingOrderItem,
  PendingOrderListItem,
} from '../../application/dtos/orders/list-pending-orders-dto.js';
import type { OrderDateRange } from '../../application/dtos/orders/order-date-range.js';
import type { OrderHistoryListItem } from '../../application/dtos/orders/list-order-history-dto.js';
import type { PreparingOrderListItem } from '../../application/dtos/orders/list-preparing-orders-dto.js';
import type { OrderQueries } from '../../application/queries/order-queries.js';
import type { TrackOrderOutput } from '../../application/dtos/orders/track-order-dto.js';

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

export class PrismaOrderQueries implements OrderQueries {
  public constructor(private readonly prisma: PrismaClient) {}

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
    const orders = await this.prisma.order.findMany({
      where: { status: 'PENDING', ...(range ? { createdAt: { gte: range.start, lt: range.end } } : {}) },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
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
        status: 'PENDING',
        total: order.total.toString(),
        createdAt: order.createdAt.toISOString(),
        items: this.mapItems(order.items),
      });
    }

    return pendingOrders;
  }

  public async findHistory(range?: OrderDateRange): Promise<OrderHistoryListItem[]> {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: ['COMPLETED', 'CANCELED'] }, ...(range ? { createdAt: { gte: range.start, lt: range.end } } : {}) },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
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
    const orders = await this.prisma.order.findMany({
      where: { status: { in: ['CONFIRMED', 'PREPARING'] }, ...(range ? { createdAt: { gte: range.start, lt: range.end } } : {}) },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
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
