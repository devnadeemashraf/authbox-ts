import type { PathsObject } from '../../openapi.types';

export const verifyResetOtpPath: PathsObject = {
  '/api/v1/auth/verify-reset-otp': {
    post: {
      summary: 'Verify reset OTP',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'otp'],
              properties: {
                email: { type: 'string', format: 'email' },
                otp: { type: 'string', pattern: '^\\d{6}$' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Returns resetToken' },
        401: { description: 'Invalid OTP' },
      },
    },
  },
};
