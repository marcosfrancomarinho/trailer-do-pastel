import type { NextFunction, Request, Response } from 'express';
import type { StoreStatusOutput } from '../../../../application/dtos/store/store-status-dto.js';
import { GetStoreStatus } from '../../../../application/use-cases/store/get-store-status.js';
import { SetStoreStatus } from '../../../../application/use-cases/store/set-store-status.js';

export class StoreController {
  public constructor(
    private getStoreStatus: GetStoreStatus,
    private setStoreStatus: SetStoreStatus,
  ) {}

  public async getStatus(
    _request: Request,
    response: Response<StoreStatusOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      response.set('Cache-Control', 'no-store');

      const output = await this.getStoreStatus.get();

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }

  public async open(
    _request: Request,
    response: Response<StoreStatusOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const output = await this.setStoreStatus.open();

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }

  public async close(
    _request: Request,
    response: Response<StoreStatusOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const output = await this.setStoreStatus.close();

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
