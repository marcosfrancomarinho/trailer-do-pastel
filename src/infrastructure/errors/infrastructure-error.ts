export type InfrastructureErrorCode =
  | 'CONNECTION_FAILED'
  | 'PERSISTENCE_FAILED'
  | 'EXTERNAL_SERVICE_FAILED'
  | 'TIMEOUT'
  | 'INVALID_CONFIGURATION'
  | 'ALREADY_EXISTS'
  | 'NOT_FOUND'
  | 'UNAVAILABLE'
  | 'IN_USE'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN';

export class InfrastructureError extends Error {
  public constructor(
    public field: string,
    public code: InfrastructureErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'InfrastructureError';
  }
}
