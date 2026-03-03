import type { PathsObject } from '../../openapi.types';

export const sessionsPath: PathsObject = {
  '/api/v1/auth/sessions': {
    get: {
      summary: 'List active sessions',
      description:
        'Returns all active (non-expired) sessions for the authenticated user. Each session includes id, deviceInfo, ipAddress, createdAt, and isCurrent (true for the session tied to the current access token).',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sessions'],
                properties: {
                  sessions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'createdAt', 'isCurrent'],
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        deviceInfo: { type: 'string', nullable: true },
                        ipAddress: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        isCurrent: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
    delete: {
      summary: 'Revoke all sessions',
      description:
        'Revokes all sessions for the authenticated user. User will need to log in again on all devices.',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      responses: {
        204: { description: 'No content' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/api/v1/auth/sessions/{id}': {
    delete: {
      summary: 'Revoke a session',
      description:
        'Revokes a specific session. User can only revoke their own sessions. The revoked session will no longer be valid for refresh.',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Session id to revoke',
        },
      ],
      responses: {
        204: { description: 'No content' },
        401: { description: 'Unauthorized' },
        403: { description: "Forbidden – cannot revoke another user's session" },
        404: { description: 'Session not found' },
      },
    },
  },
};
