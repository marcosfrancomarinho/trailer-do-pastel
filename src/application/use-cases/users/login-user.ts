import type { UserRepository } from '../../../domain/repositories/user-repository.js';
import { UserName } from '../../../domain/value-objects/user/user-name.js';
import { UserPassword } from '../../../domain/value-objects/user/user-password.js';
import type { LoginUserInput, LoginUserOutput } from '../../dtos/users/login-user-dto.js';
import { ApplicationError } from '../../errors/application-error.js';
import type { AuthTokenGateway } from '../../gateways/auth-token-gateway.js';
import type { PasswordHasher } from '../../gateways/password-hasher.js';

export class LoginUser {
  public constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
    private authTokenGateway: AuthTokenGateway,
  ) {}

  public async login(input: LoginUserInput): Promise<LoginUserOutput> {
    const name = UserName.create(input.name);
    const password = UserPassword.create(input.password);
    const user = await this.userRepository.findByName(name.getValue());

    if (!user) {
      throw new ApplicationError('credentials', 'INVALID_CREDENTIALS', 'Nome ou senha inválidos.');
    }

    const passwordMatches = await this.passwordHasher.match(password.getValue(), user.getPassword());

    if (!passwordMatches) {
      throw new ApplicationError('credentials', 'INVALID_CREDENTIALS', 'Nome ou senha inválidos.');
    }

    const accessToken = await this.authTokenGateway.issue(user.getId());
    return { name: user.getName(), role: user.getRole(), accessToken };
  }
}
