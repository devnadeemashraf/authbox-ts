import * as argon2 from 'argon2';
import { injectable } from 'tsyringe';

/**
 * Argon2 password hashing wrapper. Single responsibility: cryptography.
 */
@injectable()
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
