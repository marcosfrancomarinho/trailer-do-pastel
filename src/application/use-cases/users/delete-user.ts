import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { UserRepository } from '../../../domain/repositories/user-repository.js';
import { ApplicationError } from '../../errors/application-error.js';

export class DeleteUser {
  public constructor(private readonly userRepository: UserRepository) {}

  public async delete(input: { userId: string; currentUserId: string }): Promise<void> {
    const userId = ReferenceId.create(input.userId, 'userId').getValue();
    const currentUserId = ReferenceId.create(input.currentUserId, 'currentUserId').getValue();
    if (userId === currentUserId) {
      throw new ApplicationError('userId', 'IN_USE', 'Você não pode excluir sua própria conta.');
    }
    await this.userRepository.deleteById(userId);
  }
}
