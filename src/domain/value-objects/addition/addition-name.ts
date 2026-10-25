import { DomainError } from '../../errors/domain-error.js';

export class AdditionName {
  private constructor(private name: string) {}

  public static create(name: string): AdditionName {
    AdditionName.validate(name);
    return new AdditionName(name.trim());
  }

  public getValue(): string {
    return this.name;
  }

  private static validate(name: unknown): void {
    if (name === undefined || name === null) {
      throw new DomainError('name', 'REQUIRED', 'O nome do adicional não pode ser nulo ou indefinido.');
    }

    if (typeof name !== 'string') {
      throw new DomainError('name', 'INVALID_TYPE', 'O nome do adicional deve ser um texto.');
    }

    if (!name.trim()) {
      throw new DomainError('name', 'EMPTY', 'O nome do adicional não pode ser vazio.');
    }
  }
}
