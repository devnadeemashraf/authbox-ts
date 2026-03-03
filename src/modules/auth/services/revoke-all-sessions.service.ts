import { inject, injectable } from 'tsyringe';

import type { SessionRepository } from '../repositories/session.repository';

import { Tokens } from '@/core/di/tokens';

/**
 * Revokes all sessions for a user. User will need to log in again on all devices.
 */
@injectable()
export class RevokeAllSessionsService {
  constructor(
    @inject(Tokens.Auth.SessionRepository) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.sessionRepo.deleteByUserId(userId);
  }
}
