import { randomUUID } from 'node:crypto';

import { injectable } from 'tsyringe';

import { BadRequestError } from '@/core/errors/client-errors';
import type { FileUploadConfig } from '@/core/interfaces/file-upload.types';
import {
  createPresignedReadUrl,
  createPresignedUploadUrl,
  deleteObject as deleteS3Object,
  objectExists,
} from '@/infrastructure/object-store/s3.client';

/** Safe path segments: alphanumeric, hyphen, underscore, dot. No path traversal. */
const SAFE_SEGMENT_REGEX = /^[a-zA-Z0-9_.-]+$/;

/**
 * Sanitizes and validates object key. Prevents path traversal and injection.
 */
function sanitizeObjectKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.includes('..') || trimmed.startsWith('/') || trimmed.startsWith('.')) {
    throw new BadRequestError({ message: 'Invalid object key' });
  }
  const segments = trimmed.split('/');
  for (const seg of segments) {
    if (!SAFE_SEGMENT_REGEX.test(seg)) {
      throw new BadRequestError({
        message: 'Invalid object key: segments must be alphanumeric, hyphen, underscore, dot only',
      });
    }
  }
  return trimmed;
}

/**
 * Generic file upload service. Extensible for avatars, documents, etc.
 * Always uses presigned URLs; client uploads directly to object store.
 */
@injectable()
export class FileUploadService {
  /**
   * Validates contentType and contentLength against config, then returns presigned upload URL.
   */
  async generatePresignedUploadUrl(
    config: FileUploadConfig,
    context: { userId: string },
    input: { contentType: string; contentLength: number },
  ): Promise<{
    uploadUrl: string;
    objectKey: string;
    readUrl: string;
    expiresIn: number;
  }> {
    const { contentType, contentLength } = input;

    if (!config.allowedMimeTypes.includes(contentType)) {
      throw new BadRequestError({
        message: `Invalid content type. Allowed: ${config.allowedMimeTypes.join(', ')}`,
      });
    }
    if (contentLength > config.maxSizeBytes) {
      throw new BadRequestError({
        message: `File too large. Max size: ${config.maxSizeBytes / 1024}KB`,
      });
    }
    if (contentLength <= 0) {
      throw new BadRequestError({ message: 'Content length must be positive' });
    }

    const ext = this.getExtensionFromMime(contentType);
    const objectKey = `${config.keyPrefix}${context.userId}/${randomUUID()}${ext}`;
    sanitizeObjectKey(objectKey);

    const {
      uploadUrl,
      objectKey: key,
      expiresIn,
    } = await createPresignedUploadUrl(config.bucket, objectKey, {
      contentType,
      contentLength,
      expiresIn: config.uploadUrlExpiresIn,
    });

    const { readUrl } = await createPresignedReadUrl(config.bucket, key, config.readUrlExpiresIn);

    return {
      uploadUrl,
      objectKey: key,
      readUrl,
      expiresIn,
    };
  }

  /**
   * Generates a fresh presigned read URL for an existing object (shareable link).
   */
  async generatePresignedReadUrl(
    config: FileUploadConfig,
    objectKey: string,
  ): Promise<{ readUrl: string; expiresIn: number }> {
    const key = sanitizeObjectKey(objectKey);
    if (!key.startsWith(config.keyPrefix)) {
      throw new BadRequestError({ message: 'Invalid object key for this use case' });
    }
    return createPresignedReadUrl(config.bucket, key, config.readUrlExpiresIn);
  }

  /**
   * Deletes an object. Caller must verify ownership (e.g. avatar belongs to user).
   */
  async deleteObject(config: FileUploadConfig, objectKey: string): Promise<void> {
    const key = sanitizeObjectKey(objectKey);
    if (!key.startsWith(config.keyPrefix)) {
      throw new BadRequestError({ message: 'Invalid object key for this use case' });
    }
    await deleteS3Object(config.bucket, key);
  }

  /**
   * Verifies object exists after client upload (optional confirmation step).
   */
  async verifyObjectExists(config: FileUploadConfig, objectKey: string): Promise<boolean> {
    const key = sanitizeObjectKey(objectKey);
    if (!key.startsWith(config.keyPrefix)) return false;
    return objectExists(config.bucket, key);
  }

  private getExtensionFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return map[mime] ?? '';
  }
}
