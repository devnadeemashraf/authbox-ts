import { inject, injectable } from 'tsyringe';

import type { UserRepository } from '../repositories/user.repository';

import { env } from '@/config/env';
import { AVATAR_UPLOAD_CONFIG } from '@/core/config/file-upload.config';
import { Tokens } from '@/core/di/tokens';
import {
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from '@/core/errors/client-errors';
import type { UserCache } from '@/infrastructure/cache/user-cache';
import type { FileUploadService } from '@/modules/files/services/file-upload.service';

/**
 * Deletes user's avatar from object store and clears avatarUrl in DB.
 */
@injectable()
export class AvatarDeleteService {
  constructor(
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Cache.UserCache) private readonly userCache: UserCache,
    @inject(Tokens.Files.FileUploadService)
    private readonly fileUploadService: FileUploadService,
  ) {}

  async execute(userId: string): Promise<void> {
    if (!env.FILE_UPLOADS_ENABLED) {
      throw new ServiceUnavailableError({
        message: 'File uploads are disabled',
      });
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError({ message: 'User not found' });
    if (!user.avatarUrl) return;

    const key = user.avatarUrl;
    if (!key.startsWith(AVATAR_UPLOAD_CONFIG.keyPrefix + userId + '/')) {
      throw new ForbiddenError({ message: 'Invalid avatar key' });
    }

    await this.fileUploadService.deleteObject(AVATAR_UPLOAD_CONFIG, key);
    await this.userRepo.update(userId, { avatarUrl: null });
    await this.userCache.invalidateUser(userId, user.email);
  }
}
