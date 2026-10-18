import { DomainError } from '../../errors/domain-error.js';

export class CustomerPhone {
  private constructor(private readonly phone: string) {}

  public static create(phone: string): CustomerPhone {
    CustomerPhone.validate(phone);
    return new CustomerPhone(phone.replace(/[\s()-]/g, ''));
  }

  public getValue(): string {
    return this.phone;
  }

  private static validate(phone: unknown): void {
    if (phone === undefined || phone === null) {
      throw new DomainError('customerPhone', 'REQUIRED', 'O telefone do cliente não pode ser nulo ou indefinido.');
    }

    if (typeof phone !== 'string') {
      throw new DomainError('customerPhone', 'INVALID_TYPE', 'O telefone do cliente deve ser um texto.');
    }

    if (!phone.trim()) {
      throw new DomainError('customerPhone', 'EMPTY', 'O telefone do cliente não pode ser vazio.');
    }

    if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/[\s()-]/g, ''))) {
      throw new DomainError('customerPhone', 'INVALID_FORMAT', 'O telefone do cliente deve conter entre 10 e 15 dígitos.');
    }
  }
}
