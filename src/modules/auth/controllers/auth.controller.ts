import type { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { loginSchema, registerSchema } from '../schemas/auth.schemas';
import { LoginWithEmailService } from '../services/login-with-email.service';
import { RegisterWithEmailService } from '../services/register-with-email.service';

import { BaseController } from '@/core/base';
import { ValidationError } from '@/core/errors/client-errors';
import { created, ok } from '@/core/response';

function sanitizeUser(user: {
  id: string;
  email: string;
  username: string | null;
  isEmailVerified: boolean;
  permissions: number;
  tierId: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    isEmailVerified: user.isEmailVerified,
    permissions: user.permissions,
    tierId: user.tierId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function parseAndValidate<T>(
  schema: {
    safeParse: (data: unknown) => { success: boolean; data?: T; error?: { issues: unknown[] } };
  },
  body: unknown,
): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error!.issues;
    const firstError = issues[0] as { path: (string | number)[]; message: string } | undefined;
    const message = firstError
      ? `${firstError.path.join('.')}: ${firstError.message}`
      : 'Validation failed';
    throw new ValidationError({ message, details: { issues } });
  }
  return result.data as T;
}

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
    const input = parseAndValidate(loginSchema, req.body);
    const deviceInfo = (req.headers['user-agent'] as string) ?? undefined;
    const ipAddress = (req.ip ?? req.socket?.remoteAddress) as string | undefined;

    const result = await this.loginWithEmailService.execute(input, {
      deviceInfo,
      ipAddress,
    });

    const user = sanitizeUser(result.user);
    ok(res, { user, tokens: result.tokens });
  });

  register = this.asyncHandler(async (req: Request, res: Response) => {
    const input = parseAndValidate(registerSchema, req.body);

    const registerResult = await this.registerWithEmailService.execute(input);
    const user = sanitizeUser(registerResult.user);
    created(res, { user });
  });
}
