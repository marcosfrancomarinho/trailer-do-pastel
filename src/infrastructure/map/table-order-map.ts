import { Prisma } from '@prisma/client';
import type { TableOrderListItem } from '../../application/dtos/tables/list-table-orders-dto.js';
import { OrderItemMap } from './order-item-map.js';

export class TableOrderMap {
  public static readonly select = {
    id: true,
    customerName: true,
    customerPhone: true,
    user: { select: { name: true, role: true } },
    observation: true,
    tableId: true,
    status: true,
    total: true,
    createdAt: true,
    updatedAt: true,
    items: { select: OrderItemMap.select },
  } satisfies Prisma.OrderSelect;

  public static map(order: Prisma.OrderGetPayload<{ select: typeof TableOrderMap.select }>): TableOrderListItem {
    return {
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      createdBy: order.user ?? null,
      observation: order.observation,
      tableId: order.tableId,
      status: order.status,
      total: order.total.toString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: OrderItemMap.map(order.items),
    };
  }
}
