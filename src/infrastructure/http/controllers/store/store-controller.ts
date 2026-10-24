import type { NextFunction, Request, Response } from 'express';
import type { StoreState } from '../../../../domain/repositories/store-repository.js';
import { GetStoreStatus } from '../../../../application/use-cases/store/get-store-status.js';
import { SetStoreStatus } from '../../../../application/use-cases/store/set-store-status.js';

export class StoreController {
  public constructor(
    private readonly getStoreStatus: GetStoreStatus,
    private readonly setStoreStatus: SetStoreStatus,
  ) {}

  public async getStatus(_request: Request, response: Response<StoreState>, next: NextFunction): Promise<void> {
    try {
      response.set('Cache-Control', 'no-store');
      response.status(200).json(await this.getStoreStatus.get());
    } catch (error) {
      next(error);
    }
  }

  public async open(_request: Request, response: Response<StoreState>, next: NextFunction): Promise<void> {
    try {
      response.status(200).json(await this.setStoreStatus.open());
    } catch (error) {
      next(error);
    }
  }

  public async close(_request: Request, response: Response<StoreState>, next: NextFunction): Promise<void> {
    try {
      response.status(200).json(await this.setStoreStatus.close());
    } catch (error) {
      next(error);
    }
  }
}
