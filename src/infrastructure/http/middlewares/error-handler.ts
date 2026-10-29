import type { NextFunction, Request, Response } from 'express';
import { ApplicationError } from '../../../application/errors/application-error.js';
import { DomainError } from '../../../domain/errors/domain-error.js';
import { InfrastructureError, type InfrastructureErrorCode } from '../../errors/infrastructure-error.js';

export class ErrorHandler {
  private static infrastructureStatus: Record<InfrastructureErrorCode, number> = {
    CONNECTION_FAILED: 500,
    PERSISTENCE_FAILED: 500,
    EXTERNAL_SERVICE_FAILED: 500,
    TIMEOUT: 500,
    INVALID_CONFIGURATION: 500,
    ALREADY_EXISTS: 409,
    NOT_FOUND: 404,
    UNAVAILABLE: 409,
    IN_USE: 409,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
  };

  private static applicationStatus = {
    ALREADY_EXISTS: 409,
    NOT_FOUND: 404,
    UNAVAILABLE: 409,
    NOT_ASSOCIATED: 400,
    IN_USE: 409,
    INVALID_CREDENTIALS: 401,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
  };

  public execute(error: unknown, request: Request, response: Response, next: NextFunction): void {
    if (response.headersSent) {
      next(error);
      return;
    }

    if (error instanceof InfrastructureError) {
      const status: number = ErrorHandler.infrastructureStatus[error.code];
      response.status(status);
      response.json(status === 500
        ? { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' }
        : { field: error.field, code: error.code, message: error.message });
      return;
    }

    if (error instanceof DomainError || error instanceof ApplicationError) {
      const status = error instanceof DomainError ? 400 : ErrorHandler.applicationStatus[error.code];

      response.status(status);
      response.json({ field: error.field, code: error.code, message: error.message });
      return;
    }

    response.status(500);
    response.json({ code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' });
  }
}
