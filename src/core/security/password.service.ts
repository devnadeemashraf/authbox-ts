import * as argon2 from 'argon2';
import { injectable } from 'tsyringe';

/**
 * Handles password hashing and verification. Single responsibility: cryptography.
 */
@injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
