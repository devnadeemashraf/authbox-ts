import type { PathsObject } from '../../openapi.types';

export const emailVerifyPath: PathsObject = {
  '/api/v1/auth/email/verify': {
    post: {
      summary: 'Verify email OTP',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['otp'],
              properties: { otp: { type: 'string', pattern: '^\\d{6}$' } },
            },
          },
        },
      },
      responses: { 200: { description: 'OK' }, 401: { description: 'Invalid OTP' } },
    },
  },
};
