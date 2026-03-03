/**
 * Security-layer tokens (hashing, JWT wrappers).
 * Used for core/security capabilities injected across modules.
 */
export const SecurityTokens = {
  PasswordHasher: Symbol('authbox.security.PasswordHasher'),
} as const;
