import type { NextFunction, Request, Response } from 'express';
import type { ListPendingOrdersOutput } from '../../../../application/dtos/list-pending-orders-dto.js';
import { ListPendingOrders } from '../../../../application/use-cases/orders/list-pending-orders.js';

export class ListPendingOrdersController {
  public constructor(private readonly listPendingOrders: ListPendingOrders) {}

  public async execute(_request: Request, response: Response<ListPendingOrdersOutput>, next: NextFunction): Promise<void> {
    try {
      const output = await this.listPendingOrders.list();
      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
