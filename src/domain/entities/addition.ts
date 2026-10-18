import { DomainError } from '../errors/domain-error.js';
import type { AdditionCreatedAt } from '../value-objects/addition/addition-created-at.js';
import type { AdditionName } from '../value-objects/addition/addition-name.js';
import type { AdditionPrice } from '../value-objects/addition/addition-price.js';
import type { DecimalValue } from '../value-objects/shared/decimal-value.js';

export class Addition {
  private constructor(
    private readonly name: AdditionName,
    private readonly price: AdditionPrice,
    private readonly available: boolean,
    private readonly createdAt: AdditionCreatedAt,
    private readonly id: string | undefined,
  ) {}

  public static create(
    name: AdditionName,
    price: AdditionPrice,
    createdAt: AdditionCreatedAt,
    available: boolean = true,
    id?: string,
  ): Addition {
    return new Addition(name, price, available, createdAt, id);
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

  public getPrice(): DecimalValue {
    return this.price.getValue();
  }

  public isAvailable(): boolean {
    return this.available;
  }

  public getCreatedAt(): Date {
    return this.createdAt.getValue();
  }
}
