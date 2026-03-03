import type { PathsObject } from '../../openapi.types';

export const avatarPath: PathsObject = {
  '/api/v1/users/me/avatar/upload-url': {
    post: {
      summary: 'Get presigned upload URL for avatar',
      description: `Returns a presigned PUT URL for client-side upload. Client uploads via PUT with Content-Type and Content-Length headers.

**Progress tracking:** Use \`XMLHttpRequest\` with \`xhr.upload.onprogress\`:
\`\`\`js
const xhr = new XMLHttpRequest();
xhr.upload.onprogress = (e) => {
  if (e.lengthComputable) console.log((e.loaded / e.total) * 100 + '%');
};
xhr.open('PUT', uploadUrl);
xhr.setRequestHeader('Content-Type', contentType);
xhr.send(file);
\`\`\`

Allowed: image/jpeg, image/png, image/webp. Max 2MB. Requires FILE_UPLOADS_ENABLED=true.`,
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['contentType', 'contentLength'],
              properties: {
                contentType: {
                  type: 'string',
                  enum: ['image/jpeg', 'image/png', 'image/webp'],
                },
                contentLength: { type: 'integer', minimum: 1, maximum: 2097152 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['uploadUrl', 'objectKey', 'readUrl', 'expiresIn'],
                properties: {
                  uploadUrl: { type: 'string', format: 'uri' },
                  objectKey: { type: 'string' },
                  readUrl: { type: 'string', format: 'uri' },
                  expiresIn: { type: 'integer' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden – UPLOAD_AVATAR permission required' },
        503: { description: 'File uploads disabled' },
      },
    },
  },
  '/api/v1/users/me/avatar/confirm': {
    post: {
      summary: 'Confirm avatar upload',
      description:
        'Call after client uploads to presigned URL. Saves objectKey to user.avatarUrl and returns shareable read URL.',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['objectKey'],
              properties: { objectKey: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['readUrl'],
                properties: { readUrl: { type: 'string', format: 'uri' } },
              },
            },
          },
        },
        400: { description: 'Upload not found or invalid objectKey' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        503: { description: 'File uploads disabled' },
      },
    },
  },
  '/api/v1/users/me/avatar/read-url': {
    get: {
      summary: 'Get shareable read URL for avatar',
      description:
        "Returns a fresh presigned GET URL for the user's avatar. Use for display or sharing. Expires in 7 days.",
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['readUrl', 'expiresIn'],
                properties: {
                  readUrl: { type: 'string', format: 'uri' },
                  expiresIn: { type: 'integer' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'No avatar uploaded' },
        503: { description: 'File uploads disabled' },
      },
    },
  },
  '/api/v1/users/me/avatar': {
    delete: {
      summary: 'Delete avatar',
      description: 'Removes avatar from object store and clears user.avatarUrl.',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      responses: {
        204: { description: 'No content' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        503: { description: 'File uploads disabled' },
      },
    },
  },
};
