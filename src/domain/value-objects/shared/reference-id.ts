import { DomainError } from '../../errors/domain-error.js';

export class ReferenceId {
  private constructor(private readonly id: string) {}

  public static create(id: string, field: string = 'id'): ReferenceId {
    ReferenceId.validate(id, field);
    return new ReferenceId(id.trim());
  }

  public getValue(): string {
    return this.id;
  }

  private static validate(id: unknown, field: string): void {
    if (id === undefined || id === null) {
      throw new DomainError(field, 'REQUIRED', 'O identificador não pode ser nulo ou indefinido.');
    }

    if (typeof id !== 'string') {
      throw new DomainError(field, 'INVALID_TYPE', 'O identificador deve ser um texto.');
    }

    if (!id.trim()) {
      throw new DomainError(field, 'EMPTY', 'O identificador não pode ser vazio.');
    }
  }
}
