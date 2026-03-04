import { signRefreshToken } from '@/core/security/jwt';
import { LogoutWithRefreshService } from '@/modules/auth/services/logout-with-refresh.service';

import { createMockDb } from './helpers';

describe('LogoutWithRefreshService', () => {
  const mockSessionRepo = {
    delete: jest.fn().mockResolvedValue(true),
  };

  const mockSessionCache = {
    getSessionUserId: jest.fn().mockResolvedValue(null),
    removeSession: jest.fn().mockResolvedValue(undefined),
  };

  let service: LogoutWithRefreshService;
  const mockDb = createMockDb();

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LogoutWithRefreshService(
      mockDb,
      mockSessionRepo as never,
      mockSessionCache as never,
    );
  });

  it('does not call sessionRepo.delete when token is invalid', async () => {
    await service.execute({ refreshToken: 'invalid.jwt.token' });

    expect(mockSessionRepo.delete).not.toHaveBeenCalled();
  });

  it('does not call sessionRepo.delete when token is access type', async () => {
    const accessToken = (await import('@/core/security/jwt')).signAccessToken({
      sub: 'user-1',
      email: 'u@ex.com',
      permissions: 1,
      tierId: 1,
      jti: 'session-123',
    });
    await service.execute({ refreshToken: accessToken });

    expect(mockSessionRepo.delete).not.toHaveBeenCalled();
  });

  it('calls sessionRepo.delete with jti when valid refresh token', async () => {
    const refreshToken = signRefreshToken({
      sub: 'user-1',
      email: 'u@ex.com',
      permissions: 1,
      tierId: 1,
      jti: 'session-456',
    });
    await service.execute({ refreshToken });

    expect(mockSessionRepo.delete).toHaveBeenCalledWith('session-456');
  });
});
