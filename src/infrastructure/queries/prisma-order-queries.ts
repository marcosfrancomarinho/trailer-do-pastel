import { PrismaClient } from '@prisma/client';
import type {
  PendingOrderAddition,
  PendingOrderItem,
  PendingOrderListItem,
} from '../../application/dtos/list-pending-orders-dto.js';
import type { OrderQueries } from '../../application/queries/order-queries.js';

export class PrismaOrderQueries implements OrderQueries {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findPending(): Promise<PendingOrderListItem[]> {
    const orders = await this.prisma.order.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
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
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const pendingOrders: PendingOrderListItem[] = [];

    for (const order of orders) {
      const items: PendingOrderItem[] = [];

      for (const item of order.items) {
        const additions: PendingOrderAddition[] = [];

        for (const addition of item.additions) {
          additions.push({
            additionId: addition.additionId,
            additionName: addition.addition.name,
            quantity: addition.quantity,
            unitPrice: addition.unitPrice.toString(),
          });
        }

        items.push({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          additions,
        });
      }

      pendingOrders.push({
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        status: 'PENDING',
        total: order.total.toString(),
        createdAt: order.createdAt.toISOString(),
        items,
      });
    }

    return pendingOrders;
  }
}
