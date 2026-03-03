import { type IRouter, Router } from 'express';
import { container } from 'tsyringe';

import { authGuard, requirePermission } from '@/core/middlewares';
import { Permissions } from '@/core/security/permissions';
import { UserController } from '@/modules/users/controllers/user.controller';

const userRouter: IRouter = Router();
const userController = container.resolve(UserController);

userRouter.get('/me', authGuard, userController.getMe);
userRouter.patch('/me', authGuard, userController.patchMe);

userRouter.post(
  '/me/avatar/upload-url',
  authGuard,
  requirePermission(Permissions.UPLOAD_AVATAR),
  userController.getAvatarUploadUrl,
);
userRouter.post(
  '/me/avatar/confirm',
  authGuard,
  requirePermission(Permissions.UPLOAD_AVATAR),
  userController.postAvatarConfirm,
);
userRouter.get(
  '/me/avatar/read-url',
  authGuard,
  requirePermission(Permissions.UPLOAD_AVATAR),
  userController.getAvatarReadUrl,
);
userRouter.delete(
  '/me/avatar',
  authGuard,
  requirePermission(Permissions.UPLOAD_AVATAR),
  userController.deleteAvatar,
);

export { userRouter };
