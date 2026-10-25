import { Addition } from '../../../domain/entities/addition.js';
import type { AdditionRepository } from '../../../domain/repositories/addition-repository.js';
import { AdditionName } from '../../../domain/value-objects/addition/addition-name.js';
import { AdditionPrice } from '../../../domain/value-objects/addition/addition-price.js';
import { DecimalValue } from '../../../domain/value-objects/shared/decimal-value.js';
import type { CreateAdditionInput, CreateAdditionOutput } from '../../dtos/additions/create-addition-dto.js';
import { ApplicationError } from '../../errors/application-error.js';

export class CreateAddition {
  public constructor(private additionRepository: AdditionRepository) {}

  public async create(input: CreateAdditionInput): Promise<CreateAdditionOutput> {
    const name = AdditionName.create(input.name);
    const additionExists = await this.additionRepository.existsByName(name.getValue());

    if (additionExists) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um adicional cadastrado com esse nome.');
    }

    const decimalPrice = DecimalValue.create(input.price);
    const price = AdditionPrice.create(decimalPrice);
    const addition = Addition.create(name, price, input.available);
    const id = await this.additionRepository.save(addition);

    return { id };
  }
}
