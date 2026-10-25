import type { NextFunction, Request, Response } from 'express';
import type { ListUsersOutput } from '../../../../application/dtos/users/list-users-dto.js';
import { ListUsers } from '../../../../application/use-cases/users/list-users.js';

export class ListUsersController {
  public constructor(private listUsers: ListUsers) {}

  public async execute(_request: Request, response: Response<ListUsersOutput>, next: NextFunction): Promise<void> {
    try {
      const users = await this.listUsers.list();
      response.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }
}
