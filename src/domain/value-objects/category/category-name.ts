import { DomainError } from '../../errors/domain-error.js';

export class CategoryName {
  private constructor(private name: string) {}

  public static create(name: string): CategoryName {
    CategoryName.validate(name);
    return new CategoryName(name.trim());
  }

  public getValue(): string {
    return this.name;
  }

  private static validate(name: unknown): void {
    if (name === undefined || name === null) {
      throw new DomainError('name', 'REQUIRED', 'O nome da categoria não pode ser nulo ou indefinido.');
    }

    if (typeof name !== 'string') {
      throw new DomainError('name', 'INVALID_TYPE', 'O nome da categoria deve ser um texto.');
    }

    if (!name.trim()) {
      throw new DomainError('name', 'EMPTY', 'O nome da categoria não pode ser vazio.');
    }
  }
}
