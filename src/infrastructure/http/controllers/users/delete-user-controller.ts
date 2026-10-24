import type { NextFunction, Request, Response } from 'express';
import { DeleteUser } from '../../../../application/use-cases/users/delete-user.js';

export class DeleteUserController {
  public constructor(private readonly deleteUser: DeleteUser) {}

  public async execute(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      await this.deleteUser.delete({
        userId: request.params.userId as string,
        currentUserId: response.locals.userId as string,
      });
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
