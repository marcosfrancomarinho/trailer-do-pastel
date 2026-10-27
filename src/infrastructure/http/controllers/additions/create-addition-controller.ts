import type { NextFunction, Request, Response } from 'express';
import type { CreateAdditionInput, CreateAdditionOutput } from '../../../../application/dtos/additions/create-addition-dto.js';
import { CreateAddition } from '../../../../application/use-cases/additions/create-addition.js';

export class CreateAdditionController {
  public constructor(private createAddition: CreateAddition) {}

  public async execute(
    request: Request,
    response: Response<CreateAdditionOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input: CreateAdditionInput = {
        name: request.body?.name,
        price: request.body?.price,
        available: request.body?.available,
      };

      const output = await this.createAddition.create(input);

      response.status(201).json(output);
    } catch (error) {
      next(error);
    }
  }
}
