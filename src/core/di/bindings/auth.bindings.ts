import type { DependencyContainer } from 'tsyringe';

import { Tokens } from '../tokens';

import { SessionRepository } from '@/modules/auth/repositories/session.repository';
import { LoginWithEmailService } from '@/modules/auth/services/login-with-email.service';
import { LogoutWithRefreshService } from '@/modules/auth/services/logout-with-refresh.service';
import { RegisterWithEmailService } from '@/modules/auth/services/register-with-email.service';
import { TierEnforcementService } from '@/modules/auth/services/tier-enforcement.service';

/**
 * Registers auth-module dependencies with the container.
 */
export function registerAuthBindings(container: DependencyContainer): void {
  container.register(Tokens.Auth.SessionRepository, { useClass: SessionRepository });
  container.register(Tokens.Auth.TierEnforcementService, { useClass: TierEnforcementService });
  container.register(Tokens.Auth.LoginWithEmailService, { useClass: LoginWithEmailService });
  container.register(Tokens.Auth.RegisterWithEmailService, { useClass: RegisterWithEmailService });
  container.register(Tokens.Auth.LogoutWithRefreshService, { useClass: LogoutWithRefreshService });
}
