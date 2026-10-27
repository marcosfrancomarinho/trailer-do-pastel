import type { NextFunction, Request, Response } from 'express';
import type { TrackOrderInput, TrackOrderOutput } from '../../../../application/dtos/orders/track-order-dto.js';
import { TrackOrder } from '../../../../application/use-cases/orders/track-order.js';

export class TrackOrderController {
  public constructor(private trackOrder: TrackOrder) {}

  public async execute(
    request: Request<{ trackingToken: string }>,
    response: Response<TrackOrderOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { trackingToken } = request.params;

      const input: TrackOrderInput = { trackingToken };
      const output = await this.trackOrder.track(input);

      response.setHeader('Cache-Control', 'no-store');
      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
