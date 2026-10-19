import type { NextFunction, Request, Response } from 'express';
import { ApplicationError } from '../../../application/errors/application-error.js';
import type { AuthTokenGateway } from '../../../application/gateways/auth-token-gateway.js';

export class RequireAuthentication {
  public constructor(private readonly authTokenGateway: AuthTokenGateway) {}

  public async execute(request: Request, _response: Response, next: NextFunction): Promise<void> {
    try {
      const authorization = request.header('authorization');
      const match = /^Bearer ([^\s]+)$/i.exec(authorization ?? '');

      if (!match || !await this.authTokenGateway.verify(match[1])) {
        throw new ApplicationError('authorization', 'UNAUTHORIZED', 'Token de acesso ausente ou inválido.');
      }

      next();
    } catch (error) {
      next(error);
    }
  }
}
