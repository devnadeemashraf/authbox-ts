import type { PathsObject } from '../../openapi.types';

export const refreshPath: PathsObject = {
  '/api/v1/auth/refresh': {
    post: {
      summary: 'Refresh tokens',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: { refreshToken: { type: 'string' } },
            },
          },
        },
      },
      responses: { 200: { description: 'OK' }, 401: { description: 'Invalid token' } },
    },
  },
};
