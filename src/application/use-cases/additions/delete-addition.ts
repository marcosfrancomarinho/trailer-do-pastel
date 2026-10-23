import type { AdditionRepository } from '../../../domain/repositories/addition-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { DeleteAdditionInput } from '../../dtos/additions/delete-addition-dto.js';

export class DeleteAddition {
  public constructor(private readonly additionRepository: AdditionRepository) {}

  public async delete(input: DeleteAdditionInput): Promise<void> {
    const additionId = ReferenceId.create(input.additionId, 'additionId');
    await this.additionRepository.deleteById(additionId.getValue());
  }
}
