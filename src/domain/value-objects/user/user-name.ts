import { DomainError } from '../../errors/domain-error.js';

export class UserName {
  private constructor(private readonly name: string) {}

  public static create(name: string): UserName {
    UserName.validate(name);
    return new UserName(name.trim());
  }

  public getValue(): string {
    return this.name;
  }

  private static validate(name: unknown): void {
    if (name === undefined || name === null) {
      throw new DomainError('name', 'REQUIRED', 'O nome do usuário não pode ser nulo ou indefinido.');
    }

    if (typeof name !== 'string') {
      throw new DomainError('name', 'INVALID_TYPE', 'O nome do usuário deve ser um texto.');
    }

    if (!name.trim()) {
      throw new DomainError('name', 'EMPTY', 'O nome do usuário não pode ser vazio.');
    }
  }
}
