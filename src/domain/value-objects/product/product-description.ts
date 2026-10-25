import { DomainError } from '../../errors/domain-error.js';

export class ProductDescription {
  private constructor(private description: string) {}

  public static create(description: string): ProductDescription {
    ProductDescription.validate(description);
    return new ProductDescription(description);
  }

  public getValue(): string {
    return this.description;
  }

  private static validate(description: unknown): void {
    if (description === undefined || description === null) {
      throw new DomainError('description', 'REQUIRED', 'A descrição do produto não pode ser nula ou indefinida.');
    }

    if (typeof description !== 'string') {
      throw new DomainError('description', 'INVALID_TYPE', 'A descrição do produto deve ser um texto.');
    }

    if (!description.trim()) {
      throw new DomainError('description', 'EMPTY', 'A descrição do produto não pode ser vazia.');
    }
  }
}
