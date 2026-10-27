import type { NextFunction, Request, Response } from 'express';
import type { RemoveTableOrderOutput } from '../../../../application/dtos/tables/remove-table-order-dto.js';
import { RemoveTableOrder } from '../../../../application/use-cases/tables/remove-table-order.js';

export class RemoveTableOrderController {
  public constructor(private removeTableOrder: RemoveTableOrder) {}

  public async execute(
    request: Request<{ tableId: string; orderId: string }>,
    response: Response<RemoveTableOrderOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { tableId, orderId } = request.params;

      const output = await this.removeTableOrder.remove({
        tableId,
        orderId,
      });

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
