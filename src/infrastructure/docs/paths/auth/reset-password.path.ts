import type { PathsObject } from '../../openapi.types';

export const resetPasswordPath: PathsObject = {
  '/api/v1/auth/reset-password': {
    post: {
      summary: 'Reset password',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['resetToken', 'newPassword'],
              properties: {
                resetToken: { type: 'string' },
                newPassword: { type: 'string', minLength: 12 },
              },
            },
          },
        },
      },
      responses: { 204: { description: 'No content' }, 401: { description: 'Invalid token' } },
    },
  },
};
