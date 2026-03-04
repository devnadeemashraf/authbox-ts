import { type IRouter, Router } from 'express';
import { container } from 'tsyringe';

import { requirePermission } from '@/core/middlewares';
import { Permissions } from '@/core/security/permissions';
import { UserController } from '@/modules/users/controllers/user.controller';

const userRouter: IRouter = Router();
const userController = container.resolve(UserController);

userRouter.get('/me', userController.getMe);
userRouter.patch('/me', userController.patchMe);
userRouter.patch('/me/password', userController.changePassword);

userRouter.post(
  '/me/avatar/upload-url',
  requirePermission(Permissions.UPLOAD_AVATAR),
  userController.getAvatarUploadUrl,
);
userRouter.post(
  '/me/avatar/confirm',
  requirePermission(Permissions.UPLOAD_AVATAR),
  userController.postAvatarConfirm,
);
userRouter.get(
  '/me/avatar/read-url',
  requirePermission(Permissions.UPLOAD_AVATAR),
  userController.getAvatarReadUrl,
);
userRouter.delete(
  '/me/avatar',
  requirePermission(Permissions.UPLOAD_AVATAR),
  userController.deleteAvatar,
);

export { userRouter };
