export type DomainErrorCode =
  | 'REQUIRED'
  | 'EMPTY'
  | 'TOO_LONG'
  | 'TOO_SHORT'
  | 'MISSING_LETTER'
  | 'MISSING_NUMBER'
  | 'INVALID_TYPE'
  | 'INVALID_FORMAT'
  | 'INVALID_HASH'
  | 'INVALID_INTEGER'
  | 'TOO_LARGE'
  | 'DUPLICATE'
  | 'NOT_FINITE'
  | 'NEGATIVE'
  | 'NON_POSITIVE'
  | 'INVALID_DATE'
  | 'PAST_DATE';

export class DomainError extends Error {
  public constructor(
    public field: string,
    public code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
