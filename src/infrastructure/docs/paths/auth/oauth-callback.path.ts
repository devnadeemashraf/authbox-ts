import type { PathsObject } from '../../openapi.types';

export const oauthCallbackPath: PathsObject = {
  '/api/v1/auth/oauth/{provider}/callback': {
    get: {
      summary: 'OAuth callback',
      tags: ['Auth'],
      parameters: [
        { name: 'provider', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
        { name: 'state', in: 'query', required: true, schema: { type: 'string' } },
      ],
      responses: { 302: { description: 'Redirect with tokens' } },
    },
  },
};
