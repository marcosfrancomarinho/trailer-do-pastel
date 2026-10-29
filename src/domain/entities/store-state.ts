import { DomainError } from '../errors/domain-error.js';

export type StoreStatus = 'OPEN' | 'CLOSED';

export class StoreState {
  private constructor(
    private status: StoreStatus,
    private updatedAt: Date,
  ) {}

  public static create(status: unknown, updatedAt: unknown): StoreState {
    const validated = StoreState.validate(status, updatedAt);
    return new StoreState(validated.status, new Date(validated.updatedAt.getTime()));
  }

  private static validate(status: unknown, updatedAt: unknown): { status: StoreStatus; updatedAt: Date } {
    if (status === undefined || status === null) {
      throw new DomainError('status', 'REQUIRED', 'O status da loja é obrigatório.');
    }
    if (typeof status !== 'string') {
      throw new DomainError('status', 'INVALID_TYPE', 'O status da loja deve ser um texto.');
    }
    if (status !== 'OPEN' && status !== 'CLOSED') {
      throw new DomainError('status', 'INVALID_FORMAT', 'O status da loja deve ser OPEN ou CLOSED.');
    }
    if (updatedAt instanceof Date === false) {
      throw new DomainError('updatedAt', 'INVALID_TYPE', 'A data de atualização da loja deve ser uma data.');
    }
    if (Number.isNaN(updatedAt.getTime())) {
      throw new DomainError('updatedAt', 'INVALID_DATE', 'A data de atualização da loja é inválida.');
    }
    return { status, updatedAt };
  }

  public getStatus(): StoreStatus {
    return this.status;
  }

  public getUpdatedAt(): Date {
    return new Date(this.updatedAt.getTime());
  }

  public isClosed(): boolean {
    return this.status === 'CLOSED';
  }
}
