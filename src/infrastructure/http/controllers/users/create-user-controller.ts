import type { NextFunction, Request, Response } from 'express';
import type { CreateUserInput, CreateUserOutput } from '../../../../application/dtos/users/create-user-dto.js';
import { CreateUser } from '../../../../application/use-cases/users/create-user.js';

export class CreateUserController {
  public constructor(private createUser: CreateUser) {}

  public async execute(
    request: Request,
    response: Response<CreateUserOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input: CreateUserInput = {
        name: request.body?.name,
        password: request.body?.password,
      };

      const output = await this.createUser.create(input);

      response.status(201).json(output);
    } catch (error) {
      next(error);
    }
  }
}
