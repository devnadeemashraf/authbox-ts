/**
 * Extensible config for a file upload use case.
 * Add new configs (e.g. documents, receipts) by extending this pattern.
 */
export interface FileUploadConfig {
  /** Allowed MIME types (whitelist). E.g. ['image/jpeg', 'image/png'] */
  allowedMimeTypes: readonly string[];
  /** Max file size in bytes */
  maxSizeBytes: number;
  /** S3/MinIO bucket name */
  bucket: string;
  /** Key prefix (e.g. 'avatars/'). No leading slash. */
  keyPrefix: string;
  /** Presigned upload URL expiry in seconds */
  uploadUrlExpiresIn: number;
  /** Presigned read URL expiry in seconds (for shareable links) */
  readUrlExpiresIn: number;
}
