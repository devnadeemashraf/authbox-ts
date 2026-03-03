import type { PathsObject } from '../../openapi.types';

export const forgotPasswordPath: PathsObject = {
  '/api/v1/auth/forgot-password': {
    post: {
      summary: 'Request password reset OTP',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string', format: 'email' } },
            },
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
};
