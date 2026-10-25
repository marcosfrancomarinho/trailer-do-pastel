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
  public constructor(private additionRepository: AdditionRepository) {}

  public async update(input: UpdateAdditionInput): Promise<UpdateAdditionOutput> {
    const additionId = ReferenceId.create(input.additionId, 'additionId');
    const currentAddition = await this.additionRepository.findAdditionById(additionId.getValue());

    if (!currentAddition) {
      throw new ApplicationError('additionId', 'NOT_FOUND', 'O adicional informado não foi encontrado.');
    }

    const hasChanges = [input.name, input.price, input.available].some((value) => value !== undefined);
    if (!hasChanges) {
      throw new DomainError('addition', 'EMPTY', 'Informe pelo menos um campo para atualizar o adicional.');
    }

    const nameValue = input.name === undefined ? currentAddition.getName() : input.name;
    const priceValue = input.price === undefined ? currentAddition.getPrice() : input.price;
    const name = AdditionName.create(nameValue);
    const price = AdditionPrice.create(DecimalValue.create(priceValue));

    if (input.available !== undefined && typeof input.available !== 'boolean') {
      throw new DomainError('available', 'INVALID_TYPE', 'A disponibilidade do adicional deve ser um booleano.');
    }

    const available = input.available === undefined ? currentAddition.isAvailable() : input.available;

    if (name.getValue() !== currentAddition.getName()) {
      const nameExists = await this.additionRepository.existsByName(name.getValue());
      if (nameExists) {
        throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um adicional cadastrado com esse nome.');
      }
    }

    const addition = Addition.create(name, price, available, additionId.getValue());
    await this.additionRepository.update(addition);

    return { id: additionId.getValue() };
  }
}
