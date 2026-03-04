import type { PathsObject } from '../openapi.types';
import { emailSendVerificationPath } from './auth/email-send-verification.path';
import { emailVerifyPath } from './auth/email-verify.path';
import { forgotPasswordPath } from './auth/forgot-password.path';
import { loginPath } from './auth/login.path';
import { logoutPath } from './auth/logout.path';
import { oauthCallbackPath } from './auth/oauth-callback.path';
import { oauthInitiatePath } from './auth/oauth-initiate.path';
import { refreshPath } from './auth/refresh.path';
import { registerPath } from './auth/register.path';
import { resetPasswordPath } from './auth/reset-password.path';
import { sessionsPath } from './auth/sessions.path';
import { verifyResetOtpPath } from './auth/verify-reset-otp.path';
import { healthPath } from './health/health.path';
import { avatarPath } from './users/avatar.path';
import { changePasswordPath } from './users/change-password.path';
import { mePath } from './users/me.path';

function mergePaths(...pathObjects: PathsObject[]): PathsObject {
  return Object.assign({}, ...pathObjects);
}

/** All path definitions, one file per endpoint. Add new path modules here. */
export const allPaths: PathsObject = mergePaths(
  healthPath,
  registerPath,
  loginPath,
  logoutPath,
  refreshPath,
  oauthInitiatePath,
  oauthCallbackPath,
  emailSendVerificationPath,
  emailVerifyPath,
  forgotPasswordPath,
  verifyResetOtpPath,
  resetPasswordPath,
  sessionsPath,
  mePath,
  changePasswordPath,
  avatarPath,
);
