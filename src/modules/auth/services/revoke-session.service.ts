import { inject, injectable } from 'tsyringe';

import type { SessionRepository } from '../repositories/session.repository';

import { Tokens } from '@/core/di/tokens';
import { ForbiddenError, NotFoundError } from '@/core/errors/client-errors';

/**
 * Revokes a single session. User can only revoke their own sessions.
 */
@injectable()
export class RevokeSessionService {
  constructor(
    @inject(Tokens.Auth.SessionRepository) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError({ message: 'Session not found' });
    }
    if (session.userId !== userId) {
      throw new ForbiddenError({ message: "Cannot revoke another user's session" });
    }

    await this.sessionRepo.delete(sessionId);
  }
}
