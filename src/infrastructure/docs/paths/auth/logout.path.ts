import type { PathsObject } from '../../openapi.types';

export const logoutPath: PathsObject = {
  '/api/v1/auth/logout': {
    post: {
      summary: 'Logout',
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
      responses: { 204: { description: 'No content' } },
    },
  },
};
