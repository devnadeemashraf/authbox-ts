/**
 * Users-module tokens (repositories).
 * Cross-module DI: Auth services depend on UserRepository via this token.
 */
export const UsersTokens = {
  UserRepository: Symbol('authbox.users.UserRepository'),
} as const;
