import { User } from '../../domain/entities/user.js';
import type { UserRepository } from '../../domain/repositories/user-repository.js';
import { UserName } from '../../domain/value-objects/user/user-name.js';
import { UserPassword } from '../../domain/value-objects/user/user-password.js';
import type { CreateUserInput, CreateUserOutput } from '../dtos/create-user-dto.js';
import { ApplicationError } from '../errors/application-error.js';
import type { PasswordHasher } from '../gateways/password-hasher.js';

export class CreateUser {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  public async create(input: CreateUserInput): Promise<CreateUserOutput> {
    const name = UserName.create(input.name);
    const userExists = await this.userRepository.existsByName(name.getValue());

    if (userExists) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um usuário cadastrado com esse nome.');
    }

    const password = UserPassword.create(input.password);
    const user = User.create(name, password);
    const hash = await this.passwordHasher.hash(user.getPassword());

    user.defineEncryptedPassword(hash);

    const id = await this.userRepository.save(user);

    return { id };
  }
}
