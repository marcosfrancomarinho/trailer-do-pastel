export type DomainErrorCode =
  | 'REQUIRED'
  | 'EMPTY'
  | 'TOO_LONG'
  | 'TOO_SHORT'
  | 'MISSING_LETTER'
  | 'MISSING_NUMBER'
  | 'INVALID_TYPE'
  | 'INVALID_FORMAT'
  | 'INVALID_INTEGER'
  | 'TOO_LARGE'
  | 'DUPLICATE'
  | 'NOT_FINITE'
  | 'NON_POSITIVE'
  | 'INVALID_DATE'
  | 'PAST_DATE';

export class DomainError extends Error {
  public constructor(
    public readonly field: string,
    public readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
