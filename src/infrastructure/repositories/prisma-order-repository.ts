import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';
import type { Order } from '../../domain/entities/order.js';
import type { OrderRepository, SavedOrder } from '../../domain/repositories/order-repository.js';
import type { OrderStatus } from '../../domain/value-objects/order/order-status.js';

export class PrismaOrderRepository implements OrderRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async removeFromTable(tableId: string, orderId: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ status: string }>>`
        SELECT status FROM "tables" WHERE id = ${tableId} FOR UPDATE
      `;
      if (rows.length === 0) {
        throw new ApplicationError('tableId', 'NOT_FOUND', 'A mesa informada não foi encontrada.');
      }

      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { tableId: true, total: true, status: true },
      });
      if (order === null || order.tableId !== tableId) {
        throw new ApplicationError('orderId', 'NOT_FOUND', 'O pedido não foi encontrado nesta mesa.');
      }
      if (!['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)) {
        throw new ApplicationError('status', 'UNAVAILABLE', 'O pedido não pode mais ser retirado da mesa.');
      }

      const unlinked = await tx.order.updateMany({
        where: { id: orderId, tableId, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } },
        data: { tableId: null, status: 'CANCELED' },
      });
      if (unlinked.count !== 1) {
        const currentOrder = await tx.order.findUnique({
          where: { id: orderId },
          select: { tableId: true },
        });
        if (currentOrder === null || currentOrder.tableId !== tableId) {
          throw new ApplicationError('orderId', 'NOT_FOUND', 'O pedido não foi encontrado nesta mesa.');
        }
        throw new ApplicationError('status', 'UNAVAILABLE', 'O pedido não pode mais ser retirado da mesa.');
      }

      await tx.orderStatusHistory.create({ data: { orderId, status: 'CANCELED' } });

      const adjusted = await tx.table.updateMany({
        where: { id: tableId, totalSpent: { gte: order.total } },
        data: { totalSpent: { decrement: order.total } },
      });
      if (adjusted.count !== 1) {
        throw new ApplicationError('tableId', 'IN_USE', 'O total da mesa está inconsistente com o pedido.');
      }

      const updatedTable = await tx.table.findUniqueOrThrow({
        where: { id: tableId },
        select: { totalSpent: true },
      });
      return updatedTable.totalSpent.toString();
    });
  }

  public async save(order: Order): Promise<SavedOrder> {
    const tableId = order.getTableId();
    const total = order.getTotal();
    const data: Prisma.OrderUncheckedCreateInput = {
      tableId,
      customerName: order.getCustomerName(),
      customerPhone: order.getCustomerPhone(),
      observation: order.getObservation(),
      status: order.getStatus(),
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
      histories: { create: { status: order.getStatus() } },
    };
    const create = (prisma: Prisma.TransactionClient, tableSessionId: string | null): Promise<SavedOrder> => prisma.order.create({
      data: { ...data, tableSessionId },
      select: { id: true, trackingToken: true },
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Compartilha o bloqueio entre pedidos e espera uma abertura/fechamento em andamento.
        const store = await tx.$queryRaw<Array<{ status: string }>>`
          SELECT status FROM "store" WHERE id = 1 FOR SHARE
        `;
        if (store[0]?.status !== 'OPEN') {
          throw new ApplicationError('store', 'UNAVAILABLE', 'A loja está fechada para novos pedidos.');
        }

        if (tableId === null) return create(tx, null);

        try {
          await tx.table.update({
            where: { id: tableId },
            data: { status: 'OCCUPIED', totalSpent: { increment: total } },
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new ApplicationError('tableId', 'NOT_FOUND', 'A mesa informada não foi encontrada.');
          }
          throw error;
        }

        let session = await tx.tableSession.findFirst({
          where: { tableId, closedAt: null }, select: { id: true },
        });
        if (session === null) {
          session = await tx.tableSession.create({ data: { tableId }, select: { id: true } });
        }

        return create(tx, session.id);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2003', 'P2025'].includes(error.code)) {
        throw new ApplicationError('order', 'NOT_FOUND', 'Um produto ou adicional do pedido não foi encontrado.');
      }
      throw error;
    }
  }

  public async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const initial = await tx.order.findUnique({ where: { id }, select: { tableId: true } });
      if (initial === null) {
        throw new ApplicationError('orderId', 'NOT_FOUND', 'O pedido informado não foi encontrado.');
      }
      if (initial.tableId !== null) {
        await tx.$queryRaw`SELECT id FROM "tables" WHERE id = ${initial.tableId} FOR UPDATE`;
      }

      const current = await tx.order.findUnique({
        where: { id }, select: { tableId: true, status: true, total: true },
      });
      if (current === null) {
        throw new ApplicationError('orderId', 'NOT_FOUND', 'O pedido informado não foi encontrado.');
      }
      if (current.status === 'COMPLETED' || current.status === 'CANCELED') {
        throw new ApplicationError('status', 'UNAVAILABLE', 'Um pedido concluído ou cancelado não pode mudar de status.');
      }

      const statusValue = status.getValue();
      const updated = await tx.order.updateMany({
        where: { id, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } },
        data: { status: statusValue },
      });
      if (updated.count !== 1) {
        throw new ApplicationError('status', 'UNAVAILABLE', 'O status do pedido mudou durante a atualização.');
      }
      await tx.orderStatusHistory.create({ data: { orderId: id, status: statusValue } });

      if (statusValue === 'CANCELED' && current.tableId !== null) {
        const adjusted = await tx.table.updateMany({
          where: { id: current.tableId, totalSpent: { gte: current.total } },
          data: { totalSpent: { decrement: current.total } },
        });
        if (adjusted.count !== 1) {
          throw new ApplicationError('tableId', 'IN_USE', 'O total da mesa está inconsistente com o pedido.');
        }
      }
    });
  }
}
