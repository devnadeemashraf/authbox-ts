import type { PathsObject } from '../../openapi.types';

export const oauthInitiatePath: PathsObject = {
  '/api/v1/auth/oauth/{provider}': {
    get: {
      summary: 'OAuth initiate',
      tags: ['Auth'],
      parameters: [
        {
          name: 'provider',
          in: 'path',
          required: true,
          schema: { type: 'string', enum: ['google'] },
        },
        { name: 'success_redirect', in: 'query', schema: { type: 'string', format: 'uri' } },
      ],
      responses: { 302: { description: 'Redirect to provider' } },
    },
  },
};
