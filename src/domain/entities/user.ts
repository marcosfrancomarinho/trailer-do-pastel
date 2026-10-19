import { DomainError } from '../errors/domain-error.js';
import type { UserName } from '../value-objects/user/user-name.js';
import { UserPassword } from '../value-objects/user/user-password.js';

export class User {
  private constructor(
    private readonly name: UserName,
    private password: UserPassword,
    private readonly id: string | undefined,
  ) {}

  public static create(name: UserName, password: UserPassword, id?: string): User {
    return new User(name, password, id);
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
    return this.password.getValue();
  }

  public defineEncryptedPassword(hash: string): void {
    this.password = UserPassword.fromHash(hash);
  }
}
