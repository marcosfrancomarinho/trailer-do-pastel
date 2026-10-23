import type { NextFunction, Request, Response } from 'express';
import type { ListPendingOrdersInput, ListPendingOrdersOutput } from '../../../../application/dtos/orders/list-pending-orders-dto.js';
import { ListPendingOrders } from '../../../../application/use-cases/orders/list-pending-orders.js';

export class ListPendingOrdersController {
  public constructor(private readonly listPendingOrders: ListPendingOrders) {}

  public async execute(request: Request, response: Response<ListPendingOrdersOutput>, next: NextFunction): Promise<void> {
    try {
      const input: ListPendingOrdersInput = { date: request.query.date };
      const output = await this.listPendingOrders.list(input);
      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
