import type { NextFunction, Request, Response } from 'express';
import type {
  CreateOrderAdditionInput,
  CreateOrderInput,
  CreateOrderItemInput,
  CreateOrderOutput,
} from '../../../../application/dtos/orders/create-order-dto.js';
import { CreateOrder } from '../../../../application/use-cases/orders/create-order.js';

export class CreateOrderController {
  public constructor(private createOrder: CreateOrder) {}

  public async execute(request: Request, response: Response<CreateOrderOutput>, next: NextFunction): Promise<void> {
    try {
      const body: Request['body'] = request.body ?? {};
      const requestedItems: CreateOrderItemInput[] = body.items ?? [];

      const items: CreateOrderItemInput[] = requestedItems.map((item: CreateOrderItemInput) => {
        const requestedAdditions: CreateOrderAdditionInput[] = item.additions ?? [];

        const additions: CreateOrderAdditionInput[] = requestedAdditions.map((addition: CreateOrderAdditionInput) => ({
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
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        items,
      };

      if (body.observation !== undefined) {
        input.observation = body.observation;
      }

      if (body.tableId !== undefined) {
        input.tableId = body.tableId;
      }

      if (body.tableId != null) {
        input.userId = response.locals.userId as string | undefined;
      }

      const output: CreateOrderOutput = await this.createOrder.create(input);

      response.status(201).json(output);
    } catch (error) {
      next(error);
    }
  }
}
