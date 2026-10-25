import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { UserRepository } from '../../../domain/repositories/user-repository.js';
import { ApplicationError } from '../../errors/application-error.js';
import type { DeleteUserInput } from '../../dtos/users/delete-user-dto.js';

export class DeleteUser {
  public constructor(private userRepository: UserRepository) {}

  public async delete(input: DeleteUserInput): Promise<void> {
    const userId = ReferenceId.create(input.userId, 'userId');
    const currentUserId = ReferenceId.create(input.currentUserId, 'currentUserId');

    if (userId.getValue() === currentUserId.getValue()) {
      throw new ApplicationError('userId', 'IN_USE', 'Você não pode excluir sua própria conta.');
    }

    const userExists = await this.userRepository.existsById(userId.getValue());
    if (!userExists) {
      throw new ApplicationError('userId', 'NOT_FOUND', 'O usuário informado não foi encontrado.');
    }

    await this.userRepository.deleteById(userId.getValue());
  }
}
