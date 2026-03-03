import { inject, injectable } from 'tsyringe';

import type { SessionRepository } from '../repositories/session.repository';

import { TIER_BY_ID } from '@/core/config/tiers.config';
import { Tokens } from '@/core/di/tokens';
import { ForbiddenError } from '@/core/errors/client-errors';

/**
 * Enforces tier-based limits and rules. Single responsibility: tier policy checks.
 * Extend with additional checks (e.g. apiCallsPerMonth, storageMb) as needed.
 */
@injectable()
export class TierEnforcementService {
  constructor(
    @inject(Tokens.Auth.SessionRepository) private readonly sessionRepo: SessionRepository,
  ) {}

  /**
   * Throws ForbiddenError if the user has reached their tier's max session limit.
   */
  async enforceSessionLimit(user: { id: string; tierId: number }): Promise<void> {
    const tier = TIER_BY_ID[user.tierId] ?? TIER_BY_ID[1];
    const maxSessions = tier.features.auth.maxSessions;
    const activeCount = await this.sessionRepo.countActiveByUserId(user.id);

    if (activeCount >= maxSessions) {
      throw new ForbiddenError({
        message: `Maximum ${maxSessions} active session(s) allowed. Please revoke one before logging in.`,
      });
    }
  }
}
