export type ApplicationErrorCode = 'ALREADY_EXISTS' | 'NOT_FOUND' | 'UNAVAILABLE' | 'INVALID_CREDENTIALS';

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
