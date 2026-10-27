import type { NextFunction, Request, Response } from 'express';
import { DeleteAddition } from '../../../../application/use-cases/additions/delete-addition.js';

export class DeleteAdditionController {
  public constructor(private deleteAddition: DeleteAddition) {}

  public async execute(
    request: Request<{ additionId: string }>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { additionId } = request.params;

      await this.deleteAddition.delete({ additionId });

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
