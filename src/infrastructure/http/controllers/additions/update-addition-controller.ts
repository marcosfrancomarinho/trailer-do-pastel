import type { NextFunction, Request, Response } from 'express';
import type { UpdateAdditionInput, UpdateAdditionOutput } from '../../../../application/dtos/additions/update-addition-dto.js';
import { UpdateAddition } from '../../../../application/use-cases/additions/update-addition.js';

export class UpdateAdditionController {
  public constructor(private updateAddition: UpdateAddition) {}

  public async execute(request: Request, response: Response<UpdateAdditionOutput>, next: NextFunction): Promise<void> {
    try {
      const input: UpdateAdditionInput = {
        additionId: request.params.additionId as string,
        name: request.body?.name,
        price: request.body?.price,
        available: request.body?.available,
      };

      const output = await this.updateAddition.update(input);
      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
