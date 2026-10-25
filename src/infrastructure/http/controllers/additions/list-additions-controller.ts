import type { NextFunction, Request, Response } from 'express';
import type { ListAdditionsOutput } from '../../../../application/dtos/additions/list-additions-dto.js';
import { ListAdditions } from '../../../../application/use-cases/additions/list-additions.js';

export class ListAdditionsController {
  public constructor(private listAdditions: ListAdditions) {}

  public async execute(_request: Request, response: Response<ListAdditionsOutput>, next: NextFunction): Promise<void> {
    try {
      const output = await this.listAdditions.list();

      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
