import type { NextFunction, Request, Response } from 'express';
import { ApplicationError } from '../../../application/errors/application-error.js';

export class RequireAdmin {
  private readonly adminUserIds: Set<string>;

  public constructor(adminUserIds: string | undefined) {
    this.adminUserIds = new Set(adminUserIds?.split(',').map((id) => id.trim()).filter(Boolean) ?? []);
  }

  public execute(_request: Request, response: Response, next: NextFunction): void {
    const userId = response.locals.userId;

    if (typeof userId !== 'string' || !this.adminUserIds.has(userId)) {
      next(new ApplicationError('authorization', 'FORBIDDEN', 'Acesso restrito ao administrador.'));
      return;
    }

    next();
  }
}
