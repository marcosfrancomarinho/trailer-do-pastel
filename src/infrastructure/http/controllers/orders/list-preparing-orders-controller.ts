import type { NextFunction, Request, Response } from 'express';
import type { ListPreparingOrdersInput, ListPreparingOrdersOutput } from '../../../../application/dtos/orders/list-preparing-orders-dto.js';
import { ListPreparingOrders } from '../../../../application/use-cases/orders/list-preparing-orders.js';

export class ListPreparingOrdersController {
  public constructor(private listPreparingOrders: ListPreparingOrders) {}

  public async execute(request: Request, response: Response<ListPreparingOrdersOutput>, next: NextFunction): Promise<void> {
    try {
      const input: ListPreparingOrdersInput = { date: request.query.date };
      const output = await this.listPreparingOrders.list(input);
      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
