import { User } from '../../../domain/entities/user.js';
import type { UserRepository } from '../../../domain/repositories/user-repository.js';
import { UserName } from '../../../domain/value-objects/user/user-name.js';
import { UserPassword } from '../../../domain/value-objects/user/user-password.js';
import type { CreateUserInput, CreateUserOutput } from '../../dtos/users/create-user-dto.js';
import { ApplicationError } from '../../errors/application-error.js';
import type { PasswordHasher } from '../../gateways/password-hasher.js';

export class CreateUser {
  public constructor(
    private users: UserRepository,
    private passwords: PasswordHasher,
  ) {}

  public async create(input: CreateUserInput): Promise<CreateUserOutput> {
    const name: UserName = UserName.create(input.name);
    const userExists: boolean = await this.users.existsByName(name.getValue());

    if (userExists) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um usuário cadastrado com esse nome.');
    }

    const password: UserPassword = UserPassword.create(input.password);
    const user: User = User.create(name, password);
    const hash: string = await this.passwords.hash(user.getPassword());

    user.defineEncryptedPassword(hash);

    const id: string = await this.users.save(user);

    return { id };
  }
}
