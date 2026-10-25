import type { NextFunction, Request, Response } from 'express';
import type { UpdateOrderStatusInput, UpdateOrderStatusOutput } from '../../../../application/dtos/orders/update-order-status-dto.js';
import { UpdateOrderStatus } from '../../../../application/use-cases/orders/update-order-status.js';

export class UpdateOrderStatusController {
  public constructor(private updateOrderStatus: UpdateOrderStatus) {}

  public async execute(request: Request, response: Response<UpdateOrderStatusOutput>, next: NextFunction): Promise<void> {
    try {
      const input: UpdateOrderStatusInput = {
        status: request.body?.status,
        orderId: request.params.orderId as string,
      };

      const output = await this.updateOrderStatus.update(input);
      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
