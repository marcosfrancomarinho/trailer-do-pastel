import { Buffer } from 'node:buffer';
import { DomainError } from '../../errors/domain-error.js';

export class UserPassword {
  private constructor(private readonly password: string) {}

  public static create(password: string): UserPassword {
    UserPassword.validate(password);
    return new UserPassword(password);
  }

  public static fromHash(hash: string): UserPassword {
    if (typeof hash !== 'string' || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash)) {
      throw new DomainError('password', 'INVALID_HASH', 'O hash da senha é inválido.');
    }

    return new UserPassword(hash);
  }

  public getValue(): string {
    return this.password;
  }

  private static validate(password: unknown): void {
    if (password === undefined || password === null) {
      throw new DomainError('password', 'REQUIRED', 'A senha do usuário não pode ser nula ou indefinida.');
    }

    if (typeof password !== 'string') {
      throw new DomainError('password', 'INVALID_TYPE', 'A senha do usuário deve ser um texto.');
    }

    if (!password.trim()) {
      throw new DomainError('password', 'EMPTY', 'A senha do usuário não pode ser vazia.');
    }

    if (Array.from(password).length < 8) {
      throw new DomainError('password', 'TOO_SHORT', 'A senha do usuário deve ter pelo menos 8 caracteres.');
    }

    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new DomainError('password', 'TOO_LONG', 'A senha do usuário não pode ultrapassar 72 bytes.');
    }

    if (!/\p{L}/u.test(password)) {
      throw new DomainError('password', 'MISSING_LETTER', 'A senha do usuário deve conter pelo menos uma letra.');
    }

    if (!/[0-9]/.test(password)) {
      throw new DomainError('password', 'MISSING_NUMBER', 'A senha do usuário deve conter pelo menos um número.');
    }
  }
}
