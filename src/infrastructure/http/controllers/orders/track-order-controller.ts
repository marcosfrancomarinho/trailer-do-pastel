import type { NextFunction, Request, Response } from 'express';
import type { TrackOrderInput, TrackOrderOutput } from '../../../../application/dtos/orders/track-order-dto.js';
import type { ResolveOrderIdInput, ResolveOrderIdOutput } from '../../../../application/dtos/orders/resolve-order-id-dto.js';
import { TrackOrder } from '../../../../application/use-cases/orders/track-order.js';
import { ResolveOrderId } from '../../../../application/use-cases/orders/resolve-order-id.js';

export class TrackOrderController {
  public constructor(
    private trackOrder: TrackOrder,
    private orderIdResolver: ResolveOrderId,
  ) {}

  public async resolveOrderId(trackingToken: string): Promise<string> {
    const input: ResolveOrderIdInput = { trackingToken };
    const output: ResolveOrderIdOutput = await this.orderIdResolver.resolve(input);
    return output.id;
  }

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
