import { DomainError } from '../../errors/domain-error.js';

export class TableStatus {
  public static VALID_STATUSES = ['FREE', 'OCCUPIED'] as const;

  private constructor(private value: TableStatusValue) {}

  public static create(value: unknown): TableStatus {
    if (value === undefined || value === null) {
      throw new DomainError('status', 'REQUIRED', 'O status da mesa é obrigatório.');
    }
    if (typeof value !== 'string') {
      throw new DomainError('status', 'INVALID_TYPE', 'O status da mesa deve ser um texto.');
    }
    if (!TableStatus.VALID_STATUSES.includes(value as TableStatusValue)) {
      throw new DomainError('status', 'INVALID_FORMAT', 'O status da mesa deve ser FREE ou OCCUPIED.');
    }
    return new TableStatus(value as TableStatusValue);
  }

  public getValue(): TableStatusValue {
    return this.value;
  }
}

export type TableStatusValue = (typeof TableStatus.VALID_STATUSES)[number];
