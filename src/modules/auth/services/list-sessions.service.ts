import { inject, injectable } from 'tsyringe';

import type { SessionRepository } from '../repositories/session.repository';

import { Tokens } from '@/core/di/tokens';
import type { Session } from '@/core/interfaces/session.types';

export interface SessionListItem {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: Date;
  isCurrent: boolean;
}

/**
 * Lists active sessions for a user with isCurrent flag (matches JWT jti).
 */
@injectable()
export class ListSessionsService {
  constructor(
    @inject(Tokens.Auth.SessionRepository) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(userId: string, currentSessionJti: string): Promise<SessionListItem[]> {
    const sessions = await this.sessionRepo.findActiveByUserId(userId);

    return sessions.map((s: Session) => ({
      id: s.id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      isCurrent: s.id === currentSessionJti,
    }));
  }
}
