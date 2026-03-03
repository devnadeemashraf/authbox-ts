import type { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import {
  loginSchema,
  logoutSchema,
  oauthCallbackSchema,
  oauthInitiateSchema,
  refreshSchema,
  registerSchema,
  verifyOtpSchema,
} from '../schemas/auth.schemas';
import type { LoginWithEmailService } from '../services/login-with-email.service';
import type { LogoutWithRefreshService } from '../services/logout-with-refresh.service';
import type { OAuthService } from '../services/oauth.service';
import type { RefreshWithTokenService } from '../services/refresh-with-token.service';
import type { RegisterWithEmailService } from '../services/register-with-email.service';
import type { SendVerificationOtpService } from '../services/send-verification-otp.service';
import type { VerifyEmailOtpService } from '../services/verify-email-otp.service';

import { env } from '@/config/env';
import { BaseController } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { toUserResponseDto } from '@/core/dto';
import { created, noContent, ok } from '@/core/response';
import { validateWithZod } from '@/core/validation';

@injectable()
export class AuthController extends BaseController {
  constructor(
    @inject(Tokens.Auth.LoginWithEmailService)
    private readonly loginWithEmailService: LoginWithEmailService,
    @inject(Tokens.Auth.RegisterWithEmailService)
    private readonly registerWithEmailService: RegisterWithEmailService,
    @inject(Tokens.Auth.LogoutWithRefreshService)
    private readonly logoutWithRefreshService: LogoutWithRefreshService,
    @inject(Tokens.Auth.RefreshWithTokenService)
    private readonly refreshWithTokenService: RefreshWithTokenService,
    @inject(Tokens.Auth.OAuthService)
    private readonly oauthService: OAuthService,
    @inject(Tokens.Auth.SendVerificationOtpService)
    private readonly sendVerificationOtpService: SendVerificationOtpService,
    @inject(Tokens.Auth.VerifyEmailOtpService)
    private readonly verifyEmailOtpService: VerifyEmailOtpService,
  ) {
    super();
  }

  login = this.asyncHandler(async (req: Request, res: Response) => {
    const input = validateWithZod(loginSchema, req.body);
    const deviceInfo = (req.headers['user-agent'] as string) ?? undefined;
    const ipAddress = (req.ip ?? req.socket?.remoteAddress) as string | undefined;

    const result = await this.loginWithEmailService.execute(input, {
      deviceInfo,
      ipAddress,
    });

    ok(res, { user: toUserResponseDto(result.user), tokens: result.tokens });
  });

  register = this.asyncHandler(async (req: Request, res: Response) => {
    const input = validateWithZod(registerSchema, req.body);

    const registerResult = await this.registerWithEmailService.execute(input);
    created(res, { user: toUserResponseDto(registerResult.user) });
  });

  logout = this.asyncHandler(async (req: Request, res: Response) => {
    const input = validateWithZod(logoutSchema, req.body);
    await this.logoutWithRefreshService.execute(input);
    noContent(res);
  });

  refresh = this.asyncHandler(async (req: Request, res: Response) => {
    const input = validateWithZod(refreshSchema, req.body);
    const deviceInfo = (req.headers['user-agent'] as string) ?? undefined;
    const ipAddress = (req.ip ?? req.socket?.remoteAddress) as string | undefined;

    const result = await this.refreshWithTokenService.execute(input, {
      deviceInfo,
      ipAddress,
    });

    ok(res, { user: toUserResponseDto(result.user), tokens: result.tokens });
  });

  oauthInitiate = this.asyncHandler(async (req: Request, res: Response) => {
    const provider = req.params.provider as string;
    const input = validateWithZod(oauthInitiateSchema, req.query);
    const result = this.oauthService.initiate(provider, input.success_redirect);
    ok(res, result);
  });

  oauthCallback = this.asyncHandler(async (req: Request, res: Response) => {
    const input = validateWithZod(oauthCallbackSchema, req.query);
    const deviceInfo = (req.headers['user-agent'] as string) ?? undefined;
    const ipAddress = (req.ip ?? req.socket?.remoteAddress) as string | undefined;

    const result = await this.oauthService.callback(input.code, input.state, {
      deviceInfo,
      ipAddress,
    });

    const redirectUrl = result.successRedirect ?? env.FRONTEND_URL;
    const fragment = `access_token=${result.tokens.accessToken}&refresh_token=${result.tokens.refreshToken}`;
    const separator = redirectUrl.includes('#') ? '&' : '#';
    res.redirect(302, `${redirectUrl}${separator}${fragment}`);
  });

  sendVerificationOtp = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const result = await this.sendVerificationOtpService.execute(userId);
    ok(res, result);
  });

  verifyEmailOtp = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const input = validateWithZod(verifyOtpSchema, req.body);
    await this.verifyEmailOtpService.execute(userId, input.otp);
    ok(res, { verified: true });
  });
}
