import { DomainError } from '../../errors/domain-error.js';

export class CustomerName {
  private constructor(private name: string) {}

  public static create(name: string): CustomerName {
    CustomerName.validate(name);
    return new CustomerName(name.trim());
  }

  public getValue(): string {
    return this.name;
  }

  private static validate(name: unknown): void {
    if (name === undefined || name === null) {
      throw new DomainError('customerName', 'REQUIRED', 'O nome do cliente não pode ser nulo ou indefinido.');
    }

    if (typeof name !== 'string') {
      throw new DomainError('customerName', 'INVALID_TYPE', 'O nome do cliente deve ser um texto.');
    }

    if (!name.trim()) {
      throw new DomainError('customerName', 'EMPTY', 'O nome do cliente não pode ser vazio.');
    }

    if (Array.from(name.trim()).length < 3) {
      throw new DomainError('customerName', 'TOO_SHORT', 'O nome do cliente deve ter pelo menos 3 caracteres.');
    }
  }
}
