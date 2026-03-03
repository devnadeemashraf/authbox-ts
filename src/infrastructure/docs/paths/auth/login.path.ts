import type { PathsObject } from '../../openapi.types';

export const loginPath: PathsObject = {
  '/api/v1/auth/login': {
    post: {
      summary: 'Login',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'OK' }, 401: { description: 'Invalid credentials' } },
    },
  },
};
