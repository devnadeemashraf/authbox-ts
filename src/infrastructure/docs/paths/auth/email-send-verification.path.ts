import type { PathsObject } from '../../openapi.types';

export const emailSendVerificationPath: PathsObject = {
  '/api/v1/auth/email/send-verification': {
    post: {
      summary: 'Send verification OTP',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } },
    },
  },
};
