import type { NextFunction, Request, Response } from 'express';
import { ApplicationError } from '../../../application/errors/application-error.js';
import type { AuthTokenGateway } from '../../../application/gateways/auth-token-gateway.js';

export class RequireAuthentication {
  public constructor(private readonly authTokenGateway: AuthTokenGateway) {}

  public async execute(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authorization = request.header('authorization');
      const match = /^Bearer ([^\s]+)$/i.exec(authorization ?? '');

      const userId = match ? await this.authTokenGateway.verify(match[1]) : null;

      if (!userId) {
        throw new ApplicationError('authorization', 'UNAUTHORIZED', 'Token de acesso ausente ou inválido.');
      }

      response.locals.userId = userId;
      next();
    } catch (error) {
      next(error);
    }
  }
}
