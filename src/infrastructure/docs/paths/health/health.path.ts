import type { PathsObject } from '../../openapi.types';

export const healthPath: PathsObject = {
  '/health': {
    get: {
      summary: 'Health check',
      description: 'For load balancers and k8s probes',
      tags: ['Health'],
      responses: { 200: { description: 'OK' } },
    },
  },
};
