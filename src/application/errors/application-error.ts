export type ApplicationErrorCode =
  | 'ALREADY_EXISTS'
  | 'NOT_FOUND'
  | 'UNAVAILABLE'
  | 'NOT_ASSOCIATED'
  | 'IN_USE'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN';

export class ApplicationError extends Error {
  public constructor(
    public field: string,
    public code: ApplicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}
