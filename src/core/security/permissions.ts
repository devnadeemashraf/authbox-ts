export const Permissions = {
  // Base User Actions
  READ_PROFILE: 1 << 0, // 1
  UPDATE_PROFILE: 1 << 1, // 2

  // Elevated Actions
  DELETE_ACCOUNT: 1 << 2, // 4

  // Admin Actions
  MANAGE_USERS: 1 << 3, // 8
  MANAGE_TIERS: 1 << 4, // 16
  MANAGE_SUBSCRIPTIONS: 1 << 5, // 32
  UPLOAD_AVATAR: 1 << 6, // 64
} as const;

// Utility type to extract the permission names
export type PermissionName = keyof typeof Permissions;
