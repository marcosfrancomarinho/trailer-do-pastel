import type { NextFunction, Request, Response } from 'express';
import type { ListPreparingOrdersOutput } from '../../../../application/dtos/orders/list-preparing-orders-dto.js';
import { ListPreparingOrders } from '../../../../application/use-cases/orders/list-preparing-orders.js';

export class ListPreparingOrdersController {
  public constructor(private readonly listPreparingOrders: ListPreparingOrders) {}

  public async execute(_request: Request, response: Response<ListPreparingOrdersOutput>, next: NextFunction): Promise<void> {
    try {
      const output = await this.listPreparingOrders.list();
      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
