import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';
import type { Order } from '../../domain/entities/order.js';
import type { OrderRepository, SavedOrder } from '../../domain/repositories/order-repository.js';

export class PrismaOrderRepository implements OrderRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async save(order: Order): Promise<SavedOrder> {
    try {
      return await this.prisma.order.create({
        data: {
          customerName: order.getCustomerName(),
          customerPhone: order.getCustomerPhone(),
          status: order.getStatus(),
          total: order.getTotal(),
          createdAt: order.getCreatedAt(),
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
          histories: {
            create: { status: order.getStatus(), changedAt: order.getCreatedAt() },
          },
        },
        select: { id: true, trackingToken: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2003', 'P2025'].includes(error.code)) {
        throw new ApplicationError('order', 'NOT_FOUND', 'Um produto ou adicional do pedido não foi encontrado.');
      }
      throw error;
    }
  }
}
