import { inject, injectable } from 'tsyringe';

import type { UserRepository } from '../repositories/user.repository';

import { env } from '@/config/env';
import { AVATAR_UPLOAD_CONFIG } from '@/core/config/file-upload.config';
import { Tokens } from '@/core/di/tokens';
import { NotFoundError, ServiceUnavailableError } from '@/core/errors/client-errors';
import type { FileUploadService } from '@/modules/files/services/file-upload.service';

/**
 * Returns a fresh presigned read URL for the user's avatar (shareable link).
 */
@injectable()
export class AvatarReadUrlService {
  constructor(
    @inject(Tokens.Users.UserRepository) private readonly userRepo: UserRepository,
    @inject(Tokens.Files.FileUploadService)
    private readonly fileUploadService: FileUploadService,
  ) {}

  async execute(userId: string): Promise<{ readUrl: string; expiresIn: number }> {
    if (!env.FILE_UPLOADS_ENABLED) {
      throw new ServiceUnavailableError({
        message: 'File uploads are disabled',
      });
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError({ message: 'User not found' });
    if (!user.avatarUrl) {
      throw new NotFoundError({ message: 'No avatar uploaded' });
    }

    return this.fileUploadService.generatePresignedReadUrl(AVATAR_UPLOAD_CONFIG, user.avatarUrl);
  }
}
