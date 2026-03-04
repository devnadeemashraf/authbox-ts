/**
 * Users-module tokens (repositories).
 * Cross-module DI: Auth services depend on UserRepository via this token.
 */
export const UsersTokens = {
  UserRepository: Symbol('authbox.users.UserRepository'),
  GetMeService: Symbol('authbox.users.GetMeService'),
  UpdateMeService: Symbol('authbox.users.UpdateMeService'),
  ChangePasswordService: Symbol('authbox.users.ChangePasswordService'),
  AvatarUploadUrlService: Symbol('authbox.users.AvatarUploadUrlService'),
  AvatarConfirmService: Symbol('authbox.users.AvatarConfirmService'),
  AvatarDeleteService: Symbol('authbox.users.AvatarDeleteService'),
  AvatarReadUrlService: Symbol('authbox.users.AvatarReadUrlService'),
} as const;
