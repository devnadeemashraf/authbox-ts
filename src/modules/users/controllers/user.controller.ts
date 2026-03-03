import type { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { updateMeSchema } from '../schemas/user.schemas';
import type { GetMeService } from '../services/get-me.service';
import type { UpdateMeService } from '../services/update-me.service';

import { BaseController } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { toUserResponseDto } from '@/core/dto';
import { ok } from '@/core/response';
import { validateWithZod } from '@/core/validation';

@injectable()
export class UserController extends BaseController {
  constructor(
    @inject(Tokens.Users.GetMeService) private readonly getMeService: GetMeService,
    @inject(Tokens.Users.UpdateMeService) private readonly updateMeService: UpdateMeService,
  ) {
    super();
  }

  getMe = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const user = await this.getMeService.execute(userId);
    ok(res, toUserResponseDto(user));
  });

  patchMe = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const input = validateWithZod(updateMeSchema, req.body);
    const user = await this.updateMeService.execute(userId, input);
    ok(res, toUserResponseDto(user));
  });
}
