import bcrypt from 'bcrypt';
import type { PasswordHasher } from '../../application/gateways/password-hasher.js';

export class BcryptPasswordHasher implements PasswordHasher {
  private static rounds = 12;

  public async hash(password: string): Promise<string> {
    return bcrypt.hash(password, BcryptPasswordHasher.rounds);
  }

  public async match(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
