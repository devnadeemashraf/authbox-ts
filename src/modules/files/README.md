# File Upload Module

Extensible presigned-URL file uploads. Client uploads directly to MinIO/S3; backend never streams file bytes.

## Flow

1. **POST /me/avatar/upload-url** — Request presigned PUT URL (body: `contentType`, `contentLength`)
2. **Client** — `PUT` file to `uploadUrl` with same `Content-Type` and `Content-Length`
3. **POST /me/avatar/confirm** — Save `objectKey` to user, get shareable `readUrl`
4. **GET /me/avatar/read-url** — Fresh presigned GET URL for display/sharing
5. **DELETE /me/avatar** — Remove from store and clear user.avatarUrl

## Progress Tracking

Use `XMLHttpRequest.upload.onprogress` when uploading to the presigned URL:

```js
const xhr = new XMLHttpRequest();
xhr.upload.onprogress = (e) => {
  if (e.lengthComputable) setProgress((e.loaded / e.total) * 100);
};
xhr.open('PUT', uploadUrl);
xhr.setRequestHeader('Content-Type', contentType);
xhr.send(file);
```

## Extending for New Use Cases

1. Add config in `core/config/file-upload.config.ts`:

```ts
export const DOCUMENT_UPLOAD_CONFIG: FileUploadConfig = {
  allowedMimeTypes: ['application/pdf', 'image/jpeg'],
  maxSizeBytes: 10 * 1024 * 1024,
  bucket: env.MINIO_BUCKET,
  keyPrefix: 'documents/',
  uploadUrlExpiresIn: 15 * 60,
  readUrlExpiresIn: 24 * 60 * 60,
};
```

2. Create service (e.g. `DocumentUploadUrlService`) that calls `FileUploadService.generatePresignedUploadUrl` with your config.
3. Add routes, controller, schemas.

## Security

- MIME type whitelist
- Size limits enforced before issuing URL
- Object key sanitization (no path traversal)
- Ownership checks (e.g. avatar key must start with `avatars/{userId}/`)
