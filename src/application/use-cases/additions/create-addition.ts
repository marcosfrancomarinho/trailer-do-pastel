import { ApplicationError } from '../../errors/application-error.js';
import { Addition } from '../../../domain/entities/addition.js';
import type { AdditionRepository } from '../../../domain/repositories/addition-repository.js';
import { AdditionName } from '../../../domain/value-objects/addition/addition-name.js';
import { AdditionPrice } from '../../../domain/value-objects/addition/addition-price.js';
import { DecimalValue } from '../../../domain/value-objects/shared/decimal-value.js';
import type { CreateAdditionInput, CreateAdditionOutput } from '../../dtos/additions/create-addition-dto.js';

export class CreateAddition {
  public constructor(private additions: AdditionRepository) {}

  public async create(input: CreateAdditionInput): Promise<CreateAdditionOutput> {
    const name: AdditionName = AdditionName.create(input.name);
    const price: AdditionPrice = AdditionPrice.create(DecimalValue.create(input.price));
    const addition: Addition = Addition.create(name, price, input.available);

    const existing: Addition | null = await this.additions.findByName(addition.getName());

    if (existing && existing.isActive()) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um adicional cadastrado com esse nome.');
    }

    if (existing) {
      const id: string = await this.additions.reactivate(existing.getId(), addition);
      return { id };
    }

    const id: string = await this.additions.save(addition);

    return { id };
  }
}
