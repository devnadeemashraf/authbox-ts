import type { IRouter } from 'express';
import swaggerUi from 'swagger-ui-express';

import { createOpenApiSpec } from './spec';

const spec = createOpenApiSpec();

/** Mounts Swagger UI at /docs. Call from app: mountDocs(app) */
export function mountDocs(app: IRouter): void {
  app.use(
    '/docs',
    ...swaggerUi.serve,
    swaggerUi.setup(spec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
    }),
  );
}
