import { inject, injectable } from 'tsyringe';

import type { UserRepository } from '../repositories/user.repository';

import { env } from '@/config/env';
import { AVATAR_UPLOAD_CONFIG } from '@/core/config/file-upload.config';
import { Tokens } from '@/core/di/tokens';
import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
} from '@/core/errors/client-errors';
import type { FileUploadService } from '@/modules/files/services/file-upload.service';

/**
 * After client uploads to presigned URL, call this to save objectKey to user.avatarUrl.
 */
@injectable()
export class AvatarConfirmService {
  constructor(
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Files.FileUploadService)
    private readonly fileUploadService: FileUploadService,
  ) {}

  async execute(userId: string, objectKey: string): Promise<{ readUrl: string }> {
    if (!env.FILE_UPLOADS_ENABLED) {
      throw new ServiceUnavailableError({
        message: 'File uploads are disabled',
      });
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError({ message: 'User not found' });

    const exists = await this.fileUploadService.verifyObjectExists(AVATAR_UPLOAD_CONFIG, objectKey);
    if (!exists) {
      throw new BadRequestError({
        message: 'Upload not found. Please upload the file first.',
      });
    }

    if (!objectKey.startsWith(AVATAR_UPLOAD_CONFIG.keyPrefix + userId + '/')) {
      throw new BadRequestError({ message: 'Invalid object key for your avatar' });
    }

    await this.userRepo.update(userId, { avatarUrl: objectKey });

    const { readUrl } = await this.fileUploadService.generatePresignedReadUrl(
      AVATAR_UPLOAD_CONFIG,
      objectKey,
    );

    return { readUrl };
  }
}
