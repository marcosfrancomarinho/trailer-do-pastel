import type { NextFunction, Request, Response } from 'express';
import type { ListOrderHistoryInput, ListOrderHistoryOutput } from '../../../../application/dtos/orders/list-order-history-dto.js';
import { ListOrderHistory } from '../../../../application/use-cases/orders/list-order-history.js';

export class ListOrderHistoryController {
  public constructor(private listOrderHistory: ListOrderHistory) {}

  public async execute(
    request: Request,
    response: Response<ListOrderHistoryOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input: ListOrderHistoryInput = { date: request.query.date };
      const output = await this.listOrderHistory.list(input);

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
