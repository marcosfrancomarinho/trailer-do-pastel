import type { NextFunction, Request, Response } from 'express';
import { DeleteUser } from '../../../../application/use-cases/users/delete-user.js';

export class DeleteUserController {
  public constructor(private deleteUser: DeleteUser) {}

  public async execute(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.params.userId as string;
      const currentUserId = response.locals.userId as string;

      await this.deleteUser.delete({ userId, currentUserId });

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
