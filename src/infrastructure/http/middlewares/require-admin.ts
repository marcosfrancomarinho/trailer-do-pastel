import type { NextFunction, Request, Response } from 'express';
import { ApplicationError } from '../../../application/errors/application-error.js';

export class RequireAdmin {
  public execute(_request: Request, response: Response, next: NextFunction): void {
    if (response.locals.userRole !== 'ADMIN') {
      next(new ApplicationError('authorization', 'FORBIDDEN', 'Esta ação exige um usuário administrador.'));
      return;
    }
    next();
  }
}
