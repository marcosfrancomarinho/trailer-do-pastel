import { Addition } from '../../../domain/entities/addition.js';
import { DomainError } from '../../../domain/errors/domain-error.js';
import type { AdditionRepository } from '../../../domain/repositories/addition-repository.js';
import { AdditionName } from '../../../domain/value-objects/addition/addition-name.js';
import { AdditionPrice } from '../../../domain/value-objects/addition/addition-price.js';
import { DecimalValue } from '../../../domain/value-objects/shared/decimal-value.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { UpdateAdditionInput, UpdateAdditionOutput } from '../../dtos/additions/update-addition-dto.js';
import { ApplicationError } from '../../errors/application-error.js';

export class UpdateAddition {
  public constructor(private additions: AdditionRepository) {}

  public async update(input: UpdateAdditionInput): Promise<UpdateAdditionOutput> {
    const additionId: ReferenceId = ReferenceId.create(input.additionId, 'additionId');
    const currentAddition: Addition | null = await this.additions.findById(additionId.getValue());

    if (!currentAddition) {
      throw new ApplicationError('additionId', 'NOT_FOUND', 'O adicional informado não foi encontrado.');
    }

    const hasChanges: boolean = [input.name, input.price, input.available].some((value) => value !== undefined);
    if (!hasChanges) {
      throw new DomainError('addition', 'EMPTY', 'Informe pelo menos um campo para atualizar o adicional.');
    }

    const nameValue: string = input.name === undefined ? currentAddition.getName() : input.name;
    const priceValue: string = input.price === undefined ? currentAddition.getPrice() : input.price;
    const name: AdditionName = AdditionName.create(nameValue);
    const price: AdditionPrice = AdditionPrice.create(DecimalValue.create(priceValue));
    const available: boolean = input.available === undefined ? currentAddition.isAvailable() : input.available;

    const addition: Addition = Addition.create(name, price, available, additionId.getValue());

    const nameChanged: boolean = currentAddition.hasDifferentName(name);

    const nameExists: boolean = nameChanged && (await this.additions.existsByName(name.getValue()));

    if (nameExists) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um adicional cadastrado com esse nome.');
    }

    await this.additions.update(addition);

    return { id: additionId.getValue() };
  }
}
