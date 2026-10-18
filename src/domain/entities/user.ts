import { DomainError } from '../errors/domain-error.js';
import type { UserCreatedAt } from '../value-objects/user/user-created-at.js';
import type { UserName } from '../value-objects/user/user-name.js';
import type { UserPassword } from '../value-objects/user/user-password.js';

export class User {
  private constructor(
    private readonly name: UserName,
    private password: string,
    private readonly createdAt: UserCreatedAt,
    private readonly id: string | undefined,
  ) {}

  public static create(name: UserName, password: UserPassword, createdAt: UserCreatedAt, id?: string): User {
    return new User(name, password.getValue(), createdAt, id);
  }

  public getId(): string {
    if (this.id === undefined) {
      throw new DomainError('id', 'REQUIRED', 'O usuário ainda não possui um ID.');
    }

    return this.id;
  }

  public getName(): string {
    return this.name.getValue();
  }

  public getPassword(): string {
    return this.password;
  }

  public defineEncryptedPassword(password: string): void {
    User.validateEncryptedPassword(password);
    this.password = password;
  }

  public getCreatedAt(): Date {
    return this.createdAt.getValue();
  }

  private static validateEncryptedPassword(password: unknown): void {
    if (password === undefined || password === null) {
      throw new DomainError('password', 'REQUIRED', 'A senha criptografada não pode ser nula ou indefinida.');
    }

    if (typeof password !== 'string') {
      throw new DomainError('password', 'INVALID_TYPE', 'A senha criptografada deve ser um texto.');
    }

    if (!password.trim()) {
      throw new DomainError('password', 'EMPTY', 'A senha criptografada não pode ser vazia.');
    }
  }
}
