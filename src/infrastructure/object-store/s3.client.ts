import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '@/config/env';

let s3Client: S3Client | null = null;

/**
 * Lazily creates S3 client for AWS S3 or S3-compatible storage (MinIO, etc.).
 * Only instantiated when FILE_UPLOADS_ENABLED is true.
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    const config: ConstructorParameters<typeof S3Client>[0] = {
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    };
    if (env.S3_ENDPOINT) {
      config.endpoint = env.S3_ENDPOINT;
      config.forcePathStyle = true; // Required for MinIO
    }
    s3Client = new S3Client(config);
  }
  return s3Client;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}

export interface PresignedReadResult {
  readUrl: string;
  expiresIn: number;
}

/**
 * Generates a presigned PUT URL for client-side upload.
 * Client must send PUT with same Content-Type and Content-Length.
 */
export async function createPresignedUploadUrl(
  bucket: string,
  objectKey: string,
  options: {
    contentType: string;
    contentLength: number;
    expiresIn: number;
  },
): Promise<PresignedUploadResult> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: options.contentType,
    ContentLength: options.contentLength,
  });
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: options.expiresIn,
  });
  return {
    uploadUrl,
    objectKey,
    expiresIn: options.expiresIn,
  };
}

/**
 * Generates a presigned GET URL for shareable read access.
 */
export async function createPresignedReadUrl(
  bucket: string,
  objectKey: string,
  expiresIn: number,
): Promise<PresignedReadResult> {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
  const readUrl = await getSignedUrl(client, command, { expiresIn });
  return { readUrl, expiresIn };
}

/**
 * Deletes an object from the bucket.
 */
export async function deleteObject(bucket: string, objectKey: string): Promise<void> {
  const client = getS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
}

/**
 * Checks if an object exists (for post-upload verification).
 */
export async function objectExists(bucket: string, objectKey: string): Promise<boolean> {
  try {
    const client = getS3Client();
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
    return true;
  } catch {
    return false;
  }
}
