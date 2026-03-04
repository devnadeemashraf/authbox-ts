import type { DependencyContainer } from 'tsyringe';

import { Tokens } from '../tokens';

import { UserRepository } from '@/modules/users/repositories/user.repository';
import { AvatarConfirmService } from '@/modules/users/services/avatar-confirm.service';
import { AvatarDeleteService } from '@/modules/users/services/avatar-delete.service';
import { AvatarReadUrlService } from '@/modules/users/services/avatar-read-url.service';
import { AvatarUploadUrlService } from '@/modules/users/services/avatar-upload-url.service';
import { ChangePasswordService } from '@/modules/users/services/change-password.service';
import { GetMeService } from '@/modules/users/services/get-me.service';
import { UpdateMeService } from '@/modules/users/services/update-me.service';

/**
 * Registers users-module dependencies with the container.
 */
export function registerUsersBindings(container: DependencyContainer): void {
  container.register(Tokens.Users.UserRepository, { useClass: UserRepository });
  container.register(Tokens.Users.GetMeService, { useClass: GetMeService });
  container.register(Tokens.Users.UpdateMeService, { useClass: UpdateMeService });
  container.register(Tokens.Users.ChangePasswordService, { useClass: ChangePasswordService });
  container.register(Tokens.Users.AvatarUploadUrlService, {
    useClass: AvatarUploadUrlService,
  });
  container.register(Tokens.Users.AvatarConfirmService, {
    useClass: AvatarConfirmService,
  });
  container.register(Tokens.Users.AvatarDeleteService, { useClass: AvatarDeleteService });
  container.register(Tokens.Users.AvatarReadUrlService, {
    useClass: AvatarReadUrlService,
  });
}
