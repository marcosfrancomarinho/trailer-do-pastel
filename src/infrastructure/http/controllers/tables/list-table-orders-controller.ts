import type { NextFunction, Request, Response } from 'express';
import type { ListTableOrdersOutput } from '../../../../application/dtos/tables/list-table-orders-dto.js';
import { ListTableOrders } from '../../../../application/use-cases/tables/list-table-orders.js';

export class ListTableOrdersController {
  public constructor(private listTableOrders: ListTableOrders) {}

  public async execute(request: Request, response: Response<ListTableOrdersOutput>, next: NextFunction): Promise<void> {
    try {
      const output = await this.listTableOrders.list({ tableId: request.params.tableId as string });
      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
