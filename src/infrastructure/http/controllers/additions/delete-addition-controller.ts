import type { NextFunction, Request, Response } from 'express';
import { DeleteAddition } from '../../../../application/use-cases/additions/delete-addition.js';

export class DeleteAdditionController {
  public constructor(private deleteAddition: DeleteAddition) {}

  public async execute(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      await this.deleteAddition.delete({ additionId: request.params.additionId as string });
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
