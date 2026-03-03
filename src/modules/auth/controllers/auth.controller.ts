import type { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { registerSchema } from '../schemas/auth.schemas';
import { RegisterWithEmailService } from '../services/register-with-email.service';

import { BaseController } from '@/core/base';
import { ValidationError } from '@/core/errors/client-errors';
import { created } from '@/core/response';

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

@injectable()
export class AuthController extends BaseController {
  constructor(
    @inject(RegisterWithEmailService)
    private readonly registerWithEmailService: RegisterWithEmailService,
  ) {
    super();
  }

  register = this.asyncHandler(async (req: Request, res: Response) => {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues;
      const firstError = issues[0];
      const message = firstError
        ? `${firstError.path.join('.')}: ${firstError.message}`
        : 'Validation failed';
      throw new ValidationError({ message, details: { issues } });
    }

    const registerResult = await this.registerWithEmailService.execute(parseResult.data);
    const user = sanitizeUser(registerResult.user);
    created(res, { user });
  });
}
