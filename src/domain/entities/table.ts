import { DomainError } from '../errors/domain-error.js';
import type { TableNumber } from '../value-objects/table/table-number.js';
import { TableStatus, type TableStatusValue } from '../value-objects/table/table-status.js';
import { DecimalValue } from '../value-objects/shared/decimal-value.js';

export class Table {
  private constructor(
    private readonly number: TableNumber,
    private readonly status: TableStatus,
    private readonly totalSpent: DecimalValue,
    private readonly id: string | undefined,
  ) {}

  public static create(
    number: TableNumber,
    status: TableStatus = TableStatus.create('FREE'),
    totalSpent: DecimalValue = DecimalValue.create('0'),
    id?: string,
  ): Table {
    return new Table(number, status, totalSpent, id);
  }

  public getId(): string {
    if (this.id === undefined) {
      throw new DomainError('id', 'REQUIRED', 'A mesa ainda não possui um ID.');
    }
    return this.id;
  }

  public getNumber(): number {
    return this.number.getValue();
  }

  public getStatus(): TableStatusValue {
    return this.status.getValue();
  }

  public getTotalSpent(): string {
    return this.totalSpent.getValue();
  }
}
