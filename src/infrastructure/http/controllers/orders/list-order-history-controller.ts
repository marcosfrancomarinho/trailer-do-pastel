import type { NextFunction, Request, Response } from 'express';
import type { ListOrderHistoryOutput } from '../../../../application/dtos/orders/list-order-history-dto.js';
import { ListOrderHistory } from '../../../../application/use-cases/orders/list-order-history.js';

export class ListOrderHistoryController {
  public constructor(private readonly listOrderHistory: ListOrderHistory) {}

  public async execute(_request: Request, response: Response<ListOrderHistoryOutput>, next: NextFunction): Promise<void> {
    try {
      const output = await this.listOrderHistory.list();
      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
