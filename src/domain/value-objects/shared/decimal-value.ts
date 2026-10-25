import { Decimal } from 'decimal.js';
import { DomainError } from '../../errors/domain-error.js';

export class DecimalValue {
  private constructor(private decimal: Decimal) {}

  public static create(decimal: string): DecimalValue {
    return new DecimalValue(DecimalValue.validate(decimal));
  }

  public getValue(): string {
    return this.decimal.toString();
  }

  public add(other: DecimalValue): DecimalValue {
    const highestExponent = Math.max(this.decimal.e, other.decimal.e);
    const lowestExponent = Math.min(this.decimal.e - this.decimal.sd(), other.decimal.e - other.decimal.sd());
    const precision = Math.max(20, highestExponent - lowestExponent + 2);
    const ArithmeticDecimal = Decimal.clone({ precision });

    return DecimalValue.create(new ArithmeticDecimal(this.decimal).plus(other.decimal).toString());
  }

  public multiply(other: DecimalValue): DecimalValue {
    const precision = Math.max(20, this.decimal.sd() + other.decimal.sd());
    const ArithmeticDecimal = Decimal.clone({ precision });

    return DecimalValue.create(new ArithmeticDecimal(this.decimal).times(other.decimal).toString());
  }

  private static validate(value: unknown): Decimal {
    if (value === undefined || value === null) {
      throw new DomainError('decimal', 'REQUIRED', 'O valor decimal não pode ser nulo ou indefinido.');
    }

    if (typeof value !== 'string') {
      throw new DomainError('decimal', 'INVALID_TYPE', 'O valor decimal deve ser informado como texto.');
    }

    if (!value.trim()) {
      throw new DomainError('decimal', 'EMPTY', 'O valor decimal não pode ser vazio.');
    }

    let decimal: Decimal;

    try {
      decimal = new Decimal(value.trim());
    } catch {
      throw new DomainError('decimal', 'INVALID_TYPE', 'O valor deve representar um número decimal válido.');
    }

    if (decimal.isNaN()) {
      throw new DomainError('decimal', 'INVALID_TYPE', 'O valor deve representar um número decimal válido.');
    }

    if (!decimal.isFinite()) {
      throw new DomainError('decimal', 'NOT_FINITE', 'O valor decimal deve ser finito.');
    }

    return decimal;
  }
}
