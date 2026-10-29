import { Prisma, PrismaClient } from '@prisma/client';
import { InfrastructureError } from '../errors/infrastructure-error.js';
import type { Order } from '../../domain/entities/order.js';
import type { OrderRepository, SavedOrder } from '../../domain/repositories/order-repository.js';
import { OrderStatus, type OrderStatusValue } from '../../domain/value-objects/order/order-status.js';

export class PrismaOrderRepository implements OrderRepository {
  public constructor(private prisma: PrismaClient) {}

  public async removeFromTable(tableId: string, orderId: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      // Impede que a mesa seja liberada enquanto o pedido é retirado.
      const lockedTables = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "tables" WHERE id = ${tableId} FOR UPDATE
      `;
      if (lockedTables.length === 0) {
        throw new InfrastructureError('tableId', 'NOT_FOUND', 'A mesa informada não foi encontrada.');
      }

      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { tableId: true, total: true, status: true },
      });
      if (order === null || order.tableId !== tableId) {
        throw new InfrastructureError('orderId', 'NOT_FOUND', 'O pedido não foi encontrado nesta mesa.');
      }
      if (!OrderStatus.create(order.status).canBeRemovedFromTable()) {
        throw new InfrastructureError('status', 'UNAVAILABLE', 'O pedido não pode mais ser retirado da mesa.');
      }

      const canceledOrder = await tx.order.updateMany({
        where: { id: orderId, tableId, status: { in: OrderStatus.getActiveStatuses() } },
        data: { tableId: null, status: 'CANCELED' },
      });
      if (canceledOrder.count !== 1) {
        const error = await this.getRemovalConflictError(tx, tableId, orderId);
        throw error;
      }

      await tx.orderStatusHistory.create({ data: { orderId, status: 'CANCELED' } });

      const adjustedTable = await tx.table.updateMany({
        where: { id: tableId, totalSpent: { gte: order.total } },
        data: { totalSpent: { decrement: order.total } },
      });
      if (adjustedTable.count !== 1) {
        throw new InfrastructureError('tableId', 'IN_USE', 'O total da mesa está inconsistente com o pedido.');
      }

      const table = await tx.table.findUniqueOrThrow({
        where: { id: tableId },
        select: { totalSpent: true },
      });
      return table.totalSpent.toString();
    });
  }

  private async getRemovalConflictError(
    tx: Prisma.TransactionClient,
    tableId: string,
    orderId: string,
  ): Promise<InfrastructureError> {
    const currentOrder = await tx.order.findUnique({
      where: { id: orderId },
      select: { tableId: true },
    });

    if (currentOrder?.tableId !== tableId) {
      return new InfrastructureError('orderId', 'NOT_FOUND', 'O pedido não foi encontrado nesta mesa.');
    }

    return new InfrastructureError('status', 'UNAVAILABLE', 'O pedido não pode mais ser retirado da mesa.');
  }

  public async save(order: Order): Promise<SavedOrder> {
    const tableId: string | null = order.getTableId();
    const total: string = order.getTotal();
    const status: OrderStatusValue = order.getStatus();
    const data: Prisma.OrderUncheckedCreateInput = {
      tableId,
      userId: order.getUserId(),
      customerName: order.getCustomerName(),
      customerPhone: order.getCustomerPhone(),
      observation: order.getObservation(),
      status,
      total,
      items: {
        create: order.getItems().map((item) => ({
          productId: item.getProductId(),
          productName: item.getProductName(),
          quantity: item.getQuantity(),
          unitPrice: item.getUnitPrice(),
          additions: {
            create: item.getAdditions().map((addition) => ({
              additionId: addition.getAdditionId(),
              quantity: addition.getQuantity(),
              unitPrice: addition.getUnitPrice(),
            })),
          },
        })),
      },
      histories: { create: { status } },
    };
    const create = (prisma: Prisma.TransactionClient, tableSessionId: string | null): Promise<SavedOrder> =>
      prisma.order.create({
        data: { ...data, tableSessionId },
        select: { id: true, trackingToken: true },
      });

    try {
      return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Compartilha o bloqueio entre pedidos e espera uma abertura/fechamento em andamento.
        const store: Array<{ status: string }> = await tx.$queryRaw<Array<{ status: string }>>`
          SELECT status FROM "store" WHERE id = 1 FOR SHARE
        `;
        if (store[0]?.status !== 'OPEN') {
          throw new InfrastructureError('store', 'UNAVAILABLE', 'A loja está fechada para novos pedidos.');
        }

        if (tableId === null) return create(tx, null);

        const updatedTable: Prisma.BatchPayload = await tx.table.updateMany({
          where: { id: tableId, deletedAt: null },
          data: { status: 'OCCUPIED', totalSpent: { increment: total } },
        });
        if (updatedTable.count !== 1) {
          throw new InfrastructureError('tableId', 'NOT_FOUND', 'A mesa informada não foi encontrada.');
        }

        let session: { id: string } | null = await tx.tableSession.findFirst({
          where: { tableId, closedAt: null },
          select: { id: true },
        });
        if (session === null) {
          session = await tx.tableSession.create({ data: { tableId }, select: { id: true } });
        }

        return create(tx, session.id);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2003', 'P2025'].includes(error.code)) {
        throw new InfrastructureError('order', 'NOT_FOUND', 'Um produto ou adicional do pedido não foi encontrado.');
      }
      throw error;
    }
  }

  public async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const initial = await tx.order.findUnique({ where: { id }, select: { tableId: true } });
      if (initial === null) {
        throw new InfrastructureError('orderId', 'NOT_FOUND', 'O pedido informado não foi encontrado.');
      }
      if (initial.tableId !== null) {
        await tx.$queryRaw`SELECT id FROM "tables" WHERE id = ${initial.tableId} FOR UPDATE`;
      }

      const current = await tx.order.findUnique({
        where: { id },
        select: { tableId: true, status: true, total: true },
      });
      if (current === null) {
        throw new InfrastructureError('orderId', 'NOT_FOUND', 'O pedido informado não foi encontrado.');
      }
      if (!OrderStatus.create(current.status).canChangeStatus()) {
        throw new InfrastructureError('status', 'UNAVAILABLE', 'Um pedido concluído ou cancelado não pode mudar de status.');
      }

      const statusValue = status.getValue();
      const updated = await tx.order.updateMany({
        where: { id, status: { in: OrderStatus.getActiveStatuses() } },
        data: { status: statusValue },
      });
      if (updated.count !== 1) {
        throw new InfrastructureError('status', 'UNAVAILABLE', 'O status do pedido mudou durante a atualização.');
      }
      await tx.orderStatusHistory.create({ data: { orderId: id, status: statusValue } });

      if (statusValue === 'CANCELED' && current.tableId !== null) {
        const adjusted = await tx.table.updateMany({
          where: { id: current.tableId, totalSpent: { gte: current.total } },
          data: { totalSpent: { decrement: current.total } },
        });
        if (adjusted.count !== 1) {
          throw new InfrastructureError('tableId', 'IN_USE', 'O total da mesa está inconsistente com o pedido.');
        }
      }
    });
  }
}
