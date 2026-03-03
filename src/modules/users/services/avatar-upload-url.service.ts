import { inject, injectable } from 'tsyringe';

import { env } from '@/config/env';
import { AVATAR_UPLOAD_CONFIG } from '@/core/config/file-upload.config';
import { Tokens } from '@/core/di/tokens';
import { ServiceUnavailableError } from '@/core/errors/client-errors';
import type { FileUploadService } from '@/modules/files/services/file-upload.service';

export interface AvatarUploadUrlResult {
  uploadUrl: string;
  objectKey: string;
  readUrl: string;
  expiresIn: number;
}

/**
 * Returns presigned upload URL for avatar. Client uploads via PUT to uploadUrl.
 * Use XMLHttpRequest.upload.onprogress for progress tracking.
 */
@injectable()
export class AvatarUploadUrlService {
  constructor(
    @inject(Tokens.Files.FileUploadService)
    private readonly fileUploadService: FileUploadService,
  ) {}

  async execute(
    userId: string,
    input: { contentType: string; contentLength: number },
  ): Promise<AvatarUploadUrlResult> {
    if (!env.FILE_UPLOADS_ENABLED) {
      throw new ServiceUnavailableError({
        message: 'File uploads are disabled',
      });
    }

    return this.fileUploadService.generatePresignedUploadUrl(
      AVATAR_UPLOAD_CONFIG,
      { userId },
      input,
    );
  }
}
