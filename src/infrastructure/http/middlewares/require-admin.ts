import type { NextFunction, Request, Response } from 'express';
import { InfrastructureError } from '../../errors/infrastructure-error.js';

export class RequireAdmin {
  public execute(_request: Request, response: Response, next: NextFunction): void {
    if (response.locals.userRole !== 'ADMIN') {
      next(new InfrastructureError('authorization', 'FORBIDDEN', 'Esta ação exige um usuário administrador.'));
      return;
    }
    next();
  }
}
