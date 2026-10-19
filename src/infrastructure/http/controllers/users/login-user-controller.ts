import type { NextFunction, Request, Response } from 'express';
import type { LoginUserInput, LoginUserOutput } from '../../../../application/dtos/login-user-dto.js';
import { LoginUser } from '../../../../application/use-cases/users/login-user.js';

export class LoginUserController {
  public constructor(private readonly loginUser: LoginUser) {}

  public async execute(request: Request, response: Response<LoginUserOutput>, next: NextFunction): Promise<void> {
    try {
      const input: LoginUserInput = {
        name: request.body?.name,
        password: request.body?.password,
      };
      const output = await this.loginUser.login(input);

      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
