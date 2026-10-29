import { DomainError } from '../errors/domain-error.js';
import type { AdditionName } from '../value-objects/addition/addition-name.js';
import type { AdditionPrice } from '../value-objects/addition/addition-price.js';

export class Addition {
  private constructor(
    private name: AdditionName,
    private price: AdditionPrice,
    private available: boolean,
    private id: string | undefined,
    private deletedAt: Date | null,
  ) {}

  public static create(
    name: AdditionName,
    price: AdditionPrice,
    available: boolean = true,
    id?: string,
    deletedAt: Date | null = null,
  ): Addition {
    if (typeof available !== 'boolean') {
      throw new DomainError('available', 'INVALID_TYPE', 'A disponibilidade do adicional deve ser um booleano.');
    }

    return new Addition(name, price, available, id, deletedAt);
  }

  public getId(): string {
    if (this.id === undefined) {
      throw new DomainError('id', 'REQUIRED', 'O adicional ainda não possui um ID.');
    }

    return this.id;
  }

  public getName(): string {
    return this.name.getValue();
  }

  public hasDifferentName(name: AdditionName): boolean {
    return this.name.getValue() !== name.getValue();
  }

  public getPrice(): string {
    return this.price.getValue().getValue();
  }

  public isArchived(): boolean {
    return this.deletedAt !== null;
  }

  public isActive(): boolean {
    return this.deletedAt === null;
  }

  public isAvailable(): boolean {
    return this.available;
  }

  public isUnavailable(): boolean {
    return this.available === false;
  }
}
