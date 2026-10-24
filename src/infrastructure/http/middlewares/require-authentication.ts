import type { NextFunction, Request, Response } from 'express';
import { ApplicationError } from '../../../application/errors/application-error.js';
import type { AuthTokenGateway } from '../../../application/gateways/auth-token-gateway.js';
import type { UserRepository } from '../../../domain/repositories/user-repository.js';

export class RequireAuthentication {
  public constructor(
    private readonly authTokenGateway: AuthTokenGateway,
    private readonly userRepository: UserRepository,
  ) {}

  public async execute(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const authorization = request.header('authorization');
      const match = /^Bearer ([^\s]+)$/i.exec(authorization ?? '');

      const userId = match ? await this.authTokenGateway.verify(match[1]) : null;

      const role = userId ? await this.userRepository.findRoleById(userId) : null;
      if (!userId || !role) {
        throw new ApplicationError('authorization', 'UNAUTHORIZED', 'Token de acesso ausente ou inválido.');
      }

      response.locals.userId = userId;
      response.locals.userRole = role;
      next();
    } catch (error) {
      next(error);
    }
  }
}
