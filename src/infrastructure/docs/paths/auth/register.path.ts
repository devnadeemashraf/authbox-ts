import type { PathsObject } from '../../openapi.types';

export const registerPath: PathsObject = {
  '/api/v1/auth/register': {
    post: {
      summary: 'Register',
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
                password: { type: 'string', minLength: 8 },
              },
            },
          },
        },
      },
      responses: { 201: { description: 'Created' }, 400: { description: 'Validation error' } },
    },
  },
};
