import { securitySchemes } from './components';
import { allPaths } from './paths';

import { env } from '@/config/env';

/** Assembles the full OpenAPI 3.0 spec from domain path modules. */
export function createOpenApiSpec(): object {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Authbox TS API',
      version: '1.0.0',
      description:
        'Production-ready authentication API. Register, login, OAuth, email verification, password reset.',
    },
    servers: [{ url: env.BACKEND_URL, description: 'API Server' }],
    paths: allPaths,
    components: {
      securitySchemes,
    },
  };
}
