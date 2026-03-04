import type { PathsObject } from '../../openapi.types';

export const changePasswordPath: PathsObject = {
  '/api/v1/users/me/password': {
    patch: {
      summary: 'Change password',
      description:
        "Changes the authenticated user's password. Requires current password. Invalidates all other sessions; current session remains active. OAuth-only accounts must use forgot-password first.",
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: { type: 'string', minLength: 1 },
                newPassword: {
                  type: 'string',
                  minLength: 12,
                  maxLength: 128,
                  description: 'Min 12 chars, 1 upper, 1 lower, 1 number, 1 special',
                },
              },
            },
          },
        },
      },
      responses: {
        204: { description: 'Password changed; other sessions revoked' },
        400: {
          description: 'OAuth-only account – use forgot-password to set a password first',
        },
        401: {
          description: 'Unauthorized – wrong current password or invalid token',
        },
      },
    },
  },
};
