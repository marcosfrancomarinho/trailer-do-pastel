import type { AdditionRepository } from '../../../domain/repositories/addition-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { DeleteAdditionInput } from '../../dtos/additions/delete-addition-dto.js';

export class DeleteAddition {
  public constructor(private additions: AdditionRepository) {}

  public async delete(input: DeleteAdditionInput): Promise<void> {
    const additionId: ReferenceId = ReferenceId.create(input.additionId, 'additionId');
    await this.additions.deleteById(additionId.getValue());
  }
}
