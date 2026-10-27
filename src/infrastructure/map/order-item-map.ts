import { Prisma } from '@prisma/client';
import type { PendingOrderAddition, PendingOrderItem } from '../../application/dtos/orders/list-pending-orders-dto.js';

export class OrderItemMap {
  public static readonly select = {
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

  public static map(orderItems: Prisma.OrderItemGetPayload<{ select: typeof OrderItemMap.select }>[]): PendingOrderItem[] {
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
