import type { User } from '@/core/interfaces/user.types';

/**
 * API response shape for user data. Excludes sensitive fields (e.g. passwordHash).
 */
export interface UserResponseDto {
  id: string;
  email: string;
  username: string | null;
  isEmailVerified: boolean;
  permissions: number;
  tierId: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Maps a User entity to the safe API response shape.
 */
export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    isEmailVerified: user.isEmailVerified,
    permissions: user.permissions,
    tierId: user.tierId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
