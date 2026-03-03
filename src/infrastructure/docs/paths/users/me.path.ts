import type { PathsObject } from '../../openapi.types';

export const mePath: PathsObject = {
  '/api/v1/users/me': {
    get: {
      summary: 'Current user profile',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } },
    },
  },
};
