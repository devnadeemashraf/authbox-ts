import type { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { loginSchema, registerSchema } from '../schemas/auth.schemas';
import { LoginWithEmailService } from '../services/login-with-email.service';
import { RegisterWithEmailService } from '../services/register-with-email.service';

import { BaseController } from '@/core/base';
import { toUserResponseDto } from '@/core/dto';
import { created, ok } from '@/core/response';
import { validateWithZod } from '@/core/validation';

@injectable()
export class AuthController extends BaseController {
  constructor(
    @inject(LoginWithEmailService) private readonly loginWithEmailService: LoginWithEmailService,
    @inject(RegisterWithEmailService)
    private readonly registerWithEmailService: RegisterWithEmailService,
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
}
