import type { NextFunction, Request, Response } from 'express';
import type { RemoveTableOrderOutput } from '../../../../application/dtos/tables/remove-table-order-dto.js';
import { RemoveTableOrder } from '../../../../application/use-cases/tables/remove-table-order.js';

export class RemoveTableOrderController {
  public constructor(private removeTableOrder: RemoveTableOrder) {}

  public async execute(request: Request, response: Response<RemoveTableOrderOutput>, next: NextFunction): Promise<void> {
    try {
      const output = await this.removeTableOrder.remove({
        tableId: request.params.tableId as string,
        orderId: request.params.orderId as string,
      });
      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
