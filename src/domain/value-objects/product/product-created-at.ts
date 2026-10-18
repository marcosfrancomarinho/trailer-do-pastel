import { DomainError } from '../../errors/domain-error.js';

export class ProductCreatedAt {
  private readonly timestamp: number;

  private constructor(date: Date) {
    this.timestamp = date.getTime();
  }

  public static create(date: Date = new Date(Date.now())): ProductCreatedAt {
    const now = arguments[0] === undefined ? date.getTime() : Date.now();
    ProductCreatedAt.validate(date);

    if (date.getTime() < now) {
      throw new DomainError('createdAt', 'PAST_DATE', 'A data de criação do produto não pode estar no passado.');
    }

    return new ProductCreatedAt(date);
  }

  public static restore(date: Date): ProductCreatedAt {
    ProductCreatedAt.validate(date);
    return new ProductCreatedAt(date);
  }

  public getValue(): Date {
    return new Date(this.timestamp);
  }

  private static validate(date: unknown): asserts date is Date {
    if (date === undefined || date === null) {
      throw new DomainError('createdAt', 'REQUIRED', 'A data de criação do produto não pode ser nula ou indefinida.');
    }

    if (!(date instanceof Date)) {
      throw new DomainError('createdAt', 'INVALID_TYPE', 'A data de criação do produto deve ser uma instância de Date.');
    }

    if (!Number.isFinite(date.getTime())) {
      throw new DomainError('createdAt', 'INVALID_DATE', 'A data de criação do produto deve ser válida.');
    }
  }
}
