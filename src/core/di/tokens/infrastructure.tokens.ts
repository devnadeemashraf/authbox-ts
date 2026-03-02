/**
 * Infrastructure-layer tokens (DB, Redis, Mailer, etc.)
 */
export const InfrastructureTokens = {
  Database: Symbol('authbox.infrastructure.Database'),

  // --- Future (add as needed)
  // Redis: Symbol('authbox.infrastructure.Redis'),
  // Mailer: Symbol('authbox.infrastructure.Mailer'),
} as const;
