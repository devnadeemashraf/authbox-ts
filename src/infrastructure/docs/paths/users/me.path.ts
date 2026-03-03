import type { PathsObject } from '../../openapi.types';

export const mePath: PathsObject = {
  '/api/v1/users/me': {
    get: {
      summary: 'Current user profile',
      description: "Returns the authenticated user's profile.",
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  avatarUrl: {
                    type: 'string',
                    nullable: true,
                    description: 'Object key; use GET /me/avatar/read-url for display URL',
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
    patch: {
      summary: 'Update profile',
      description:
        "Updates the authenticated user's profile. Username: 3–30 chars, alphanumeric + underscore, unique.",
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                username: {
                  type: ['string', 'null'],
                  minLength: 3,
                  maxLength: 30,
                  pattern: '^[a-zA-Z0-9_]+$',
                  description: 'Username; null to clear',
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'OK' },
        401: { description: 'Unauthorized' },
        409: { description: 'Conflict – username already taken' },
      },
    },
  },
};
