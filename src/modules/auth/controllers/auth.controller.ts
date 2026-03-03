import type { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { loginSchema, logoutSchema, refreshSchema, registerSchema } from '../schemas/auth.schemas';
import type { LoginWithEmailService } from '../services/login-with-email.service';
import type { LogoutWithRefreshService } from '../services/logout-with-refresh.service';
import type { RefreshWithTokenService } from '../services/refresh-with-token.service';
import type { RegisterWithEmailService } from '../services/register-with-email.service';

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
}
