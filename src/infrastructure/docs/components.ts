export const securitySchemes = {
  bearerAuth: {
    type: 'http' as const,
    scheme: 'bearer' as const,
    bearerFormat: 'JWT',
    description: 'Access token from login or refresh',
  },
};
