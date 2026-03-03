import type { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import {
  avatarConfirmSchema,
  avatarUploadUrlSchema,
  updateMeSchema,
} from '../schemas/user.schemas';
import type { AvatarConfirmService } from '../services/avatar-confirm.service';
import type { AvatarDeleteService } from '../services/avatar-delete.service';
import type { AvatarReadUrlService } from '../services/avatar-read-url.service';
import type { AvatarUploadUrlService } from '../services/avatar-upload-url.service';
import type { GetMeService } from '../services/get-me.service';
import type { UpdateMeService } from '../services/update-me.service';

import { BaseController } from '@/core/base';
import { Tokens } from '@/core/di/tokens';
import { toUserResponseDto } from '@/core/dto';
import { created, noContent, ok } from '@/core/response';
import { validateWithZod } from '@/core/validation';

@injectable()
export class UserController extends BaseController {
  constructor(
    @inject(Tokens.Users.GetMeService) private readonly getMeService: GetMeService,
    @inject(Tokens.Users.UpdateMeService) private readonly updateMeService: UpdateMeService,
    @inject(Tokens.Users.AvatarUploadUrlService)
    private readonly avatarUploadUrlService: AvatarUploadUrlService,
    @inject(Tokens.Users.AvatarConfirmService)
    private readonly avatarConfirmService: AvatarConfirmService,
    @inject(Tokens.Users.AvatarDeleteService)
    private readonly avatarDeleteService: AvatarDeleteService,
    @inject(Tokens.Users.AvatarReadUrlService)
    private readonly avatarReadUrlService: AvatarReadUrlService,
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

  getAvatarUploadUrl = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const input = validateWithZod(avatarUploadUrlSchema, req.body);
    const result = await this.avatarUploadUrlService.execute(userId, input);
    ok(res, result);
  });

  postAvatarConfirm = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const input = validateWithZod(avatarConfirmSchema, req.body);
    const result = await this.avatarConfirmService.execute(userId, input.objectKey);
    created(res, result);
  });

  deleteAvatar = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    await this.avatarDeleteService.execute(userId);
    noContent(res);
  });

  getAvatarReadUrl = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const result = await this.avatarReadUrlService.execute(userId);
    ok(res, result);
  });
}
