import { randomUUID } from 'node:crypto';

import type { Knex } from 'knex';
import { inject, injectable } from 'tsyringe';

import type { OAuthProviderRegistry } from '../providers/oauth-provider.registry';
import type { SessionRepository } from '../repositories/session.repository';
import type { SocialProviderRepository } from '../repositories/social-provider.repository';
import { createOAuthState, verifyOAuthState } from './oauth-state';
import type { TierEnforcementService } from './tier-enforcement.service';

import { env } from '@/config/env';
import { BaseService } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { BadRequestError, UnauthorizedError } from '@/core/errors/client-errors';
import type { User } from '@/core/interfaces/user.types';
import { signAccessToken, signRefreshToken } from '@/core/security/jwt';
import type { UserRepository } from '@/modules/users/repositories/user.repository';

export interface OAuthInitiateResult {
  authorizationUrl: string;
  state: string;
}

export interface OAuthCallbackResult {
  user: User;
  tokens: { accessToken: string; refreshToken: string };
  successRedirect?: string;
}

@injectable()
export class OAuthService extends BaseService {
  constructor(
    @inject(Tokens.Infrastructure.Database) db: Knex,
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Auth.SessionRepository) private readonly sessionRepo: SessionRepository,
    @inject(Tokens.Auth.SocialProviderRepository)
    private readonly socialProviderRepo: SocialProviderRepository,
    @inject(Tokens.Auth.OAuthProviderRegistry)
    private readonly providerRegistry: OAuthProviderRegistry,
    @inject(Tokens.Auth.TierEnforcementService)
    private readonly tierEnforcement: TierEnforcementService,
  ) {
    super(db);
  }

  /**
   * Initiates OAuth flow: builds authorization URL and state for CSRF protection.
   * @param successRedirect - Optional frontend URL to redirect to after success
   */
  initiate(providerName: string, successRedirect?: string): OAuthInitiateResult {
    if (!this.providerRegistry.has(providerName)) {
      throw new BadRequestError({ message: `Unsupported OAuth provider: ${providerName}` });
    }

    const provider = this.providerRegistry.get(providerName);
    const redirectUri = `${env.BACKEND_URL}/api/v1/auth/oauth/${providerName}/callback`;
    const state = createOAuthState({
      provider: providerName,
      redirectUri,
      successRedirect: successRedirect ?? undefined,
      nonce: randomUUID(),
    });
    const authorizationUrl = provider.getAuthorizationUrl(state, redirectUri);

    return { authorizationUrl, state };
  }

  /**
   * Handles OAuth callback: exchanges code, fetches profile, creates/links user, returns tokens.
   */
  async callback(
    code: string,
    stateToken: string,
    options?: { deviceInfo?: string; ipAddress?: string },
  ): Promise<OAuthCallbackResult> {
    let state: { provider: string; redirectUri: string; successRedirect?: string };
    try {
      state = verifyOAuthState(stateToken);
    } catch {
      throw new UnauthorizedError({ message: 'Invalid or expired OAuth state' });
    }

    const provider = this.providerRegistry.get(state.provider);
    const { accessToken } = await provider.exchangeCodeForTokens(code, state.redirectUri);
    const profile = await provider.getUserProfile(accessToken);

    if (!profile.email) {
      throw new UnauthorizedError({ message: 'Provider did not return an email' });
    }

    const existingLink = await this.socialProviderRepo.findByProvider(
      state.provider,
      profile.providerId,
    );

    const addRedirect = (result: OAuthCallbackResult): OAuthCallbackResult => ({
      ...result,
      successRedirect: state.successRedirect,
    });

    if (existingLink) {
      const user = await this.userRepo.findById(existingLink.userId);
      if (!user) throw new UnauthorizedError({ message: 'User not found' });
      return addRedirect(await this.createSessionAndTokens(user, options));
    }

    const existingUser = await this.userRepo.findByEmail(profile.email.toLowerCase());
    if (existingUser) {
      await this.linkProvider(existingUser.id, state.provider, profile.providerId);
      return addRedirect(await this.createSessionAndTokens(existingUser, options));
    }

    const newUser = await this.createUserAndLink(profile, state.provider);
    return addRedirect(await this.createSessionAndTokens(newUser, options));
  }

  private async linkProvider(
    userId: string,
    providerName: string,
    providerId: string,
  ): Promise<void> {
    await this.socialProviderRepo.create({
      id: randomUUID(),
      userId,
      providerName: providerName as 'google' | 'github',
      providerId,
    });
  }

  private async createUserAndLink(
    profile: { email: string; providerId: string; emailVerified: boolean },
    providerName: string,
  ): Promise<User> {
    const userId = randomUUID();
    const email = profile.email.toLowerCase();

    await this.db.transaction(async (trx) => {
      await trx('users').insert({
        id: userId,
        email,
        username: null,
        passwordHash: null,
        isEmailVerified: profile.emailVerified,
        permissions: 1,
        tierId: 1,
      });
      await trx('social_providers').insert({
        id: randomUUID(),
        userId,
        providerName,
        providerId: profile.providerId,
      });
    });

    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedError({ message: 'Failed to create user' });
    return user;
  }

  private async createSessionAndTokens(
    user: User,
    options?: { deviceInfo?: string; ipAddress?: string },
  ): Promise<Omit<OAuthCallbackResult, 'successRedirect'>> {
    await this.tierEnforcement.enforceSessionLimit(user);

    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.sessionRepo.create({
      id: sessionId,
      userId: user.id,
      deviceInfo: options?.deviceInfo ?? null,
      ipAddress: options?.ipAddress ?? null,
      expiresAt,
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      permissions: user.permissions,
      tierId: user.tierId,
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      permissions: user.permissions,
      tierId: user.tierId,
      jti: sessionId,
    });

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }
}
