export type ApplicationErrorCode =
  | 'ALREADY_EXISTS'
  | 'NOT_FOUND'
  | 'UNAVAILABLE'
  | 'NOT_ASSOCIATED'
  | 'IN_USE'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED';

export class ApplicationError extends Error {
  public constructor(
    public readonly field: string,
    public readonly code: ApplicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}
