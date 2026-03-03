import type { FileUploadConfig } from '../interfaces/file-upload.types';

import { env } from '@/config/env';

/** Avatar upload: images only, 2MB max */
export const AVATAR_UPLOAD_CONFIG: FileUploadConfig = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
  bucket: env.MINIO_BUCKET,
  keyPrefix: 'avatars/',
  uploadUrlExpiresIn: 15 * 60, // 15 min
  readUrlExpiresIn: 7 * 24 * 60 * 60, // 7 days for shareable link
};

/**
 * Add more configs for other use cases:
 *
 * export const DOCUMENT_UPLOAD_CONFIG: FileUploadConfig = {
 *   allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
 *   maxSizeBytes: 10 * 1024 * 1024, // 10MB
 *   bucket: env.MINIO_BUCKET,
 *   keyPrefix: 'documents/',
 *   ...
 * };
 */
