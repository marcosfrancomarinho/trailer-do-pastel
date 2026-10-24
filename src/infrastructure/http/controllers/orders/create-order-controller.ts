import type { NextFunction, Request, Response } from 'express';
import type {
  CreateOrderAdditionInput,
  CreateOrderInput,
  CreateOrderItemInput,
  CreateOrderOutput,
} from '../../../../application/dtos/orders/create-order-dto.js';
import { CreateOrder } from '../../../../application/use-cases/orders/create-order.js';

export class CreateOrderController {
  public constructor(private readonly createOrder: CreateOrder) {}

  public async execute(request: Request, response: Response<CreateOrderOutput>, next: NextFunction): Promise<void> {
    try {
      const requestedItems = request.body?.items ?? [];

      const items: CreateOrderItemInput[] = requestedItems.map((item: CreateOrderItemInput) => {
        const requestedAdditions = item.additions ?? [];

        const additions: CreateOrderAdditionInput[] = requestedAdditions.map((addition) => ({
          additionId: addition.additionId,
          quantity: addition.quantity,
        }));

        return {
          productId: item.productId,
          quantity: item.quantity,
          additions,
        };
      });

      const input: CreateOrderInput = {
        customerName: request.body?.customerName,
        customerPhone: request.body?.customerPhone,
        ...(request.body?.observation !== undefined ? { observation: request.body.observation } : {}),
        ...(request.body?.tableId !== undefined ? { tableId: request.body.tableId } : {}),
        ...(request.body?.tableId != null ? { userId: response.locals.userId as string | undefined } : {}),
        items,
      };

      const output = await this.createOrder.create(input);

      response.status(201);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
