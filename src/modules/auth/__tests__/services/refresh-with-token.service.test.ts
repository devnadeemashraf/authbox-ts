import { createMockDb } from './auth.service.helpers';

import { UserFactory } from '@/__tests__/factories/user.factory';
import { signRefreshToken } from '@/core/security/jwt';
import { RefreshWithTokenService } from '@/modules/auth/services/refresh-with-token.service';

describe('RefreshWithTokenService', () => {
  const mockUserRepo = {
    findById: jest.fn(),
  };

  const mockSessionRepo = {
    findById: jest.fn(),
    create: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(true),
  };

  let service: RefreshWithTokenService;
  const mockDb = createMockDb();

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RefreshWithTokenService(mockDb, mockUserRepo as never, mockSessionRepo as never);
  });

  it('throws UnauthorizedError when refresh token is invalid', async () => {
    await expect(service.execute({ refreshToken: 'invalid.jwt' })).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or expired refresh token',
    });
    expect(mockSessionRepo.findById).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when session not found', async () => {
    const token = signRefreshToken({
      sub: 'user-1',
      email: 'u@ex.com',
      permissions: 1,
      tierId: 1,
      jti: 'nonexistent-session',
    });
    mockSessionRepo.findById.mockResolvedValue(null);

    await expect(service.execute({ refreshToken: token })).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or expired refresh token',
    });
    expect(mockSessionRepo.findById).toHaveBeenCalledWith('nonexistent-session');
  });

  it('throws UnauthorizedError when session is expired', async () => {
    const token = signRefreshToken({
      sub: 'user-1',
      email: 'u@ex.com',
      permissions: 1,
      tierId: 1,
      jti: 'session-1',
    });
    mockSessionRepo.findById.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 1000),
      deviceInfo: null,
      ipAddress: null,
      createdAt: new Date(),
    });

    await expect(service.execute({ refreshToken: token })).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or expired refresh token',
    });
  });

  it('throws UnauthorizedError when user not found', async () => {
    const token = signRefreshToken({
      sub: 'user-1',
      email: 'u@ex.com',
      permissions: 1,
      tierId: 1,
      jti: 'session-1',
    });
    mockSessionRepo.findById.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
      deviceInfo: null,
      ipAddress: null,
      createdAt: new Date(),
    });
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(service.execute({ refreshToken: token })).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or expired refresh token',
    });
  });

  it('rotates session and returns new tokens on success', async () => {
    const user = UserFactory.build({ id: 'user-1', email: 'u@ex.com' });
    const token = signRefreshToken({
      sub: 'user-1',
      email: 'u@ex.com',
      permissions: 1,
      tierId: 1,
      jti: 'old-session',
    });
    mockSessionRepo.findById.mockResolvedValue({
      id: 'old-session',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
      deviceInfo: 'Chrome',
      ipAddress: '127.0.0.1',
      createdAt: new Date(),
    });
    mockUserRepo.findById.mockResolvedValue(user);

    const result = await service.execute({ refreshToken: token });

    expect(result.user).toEqual(user);
    expect(result.tokens).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    expect(mockSessionRepo.delete).toHaveBeenCalledWith('old-session');
    expect(mockSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        deviceInfo: null,
        ipAddress: null,
      }),
    );
  });

  it('passes deviceInfo and ipAddress to new session', async () => {
    const user = UserFactory.build({ id: 'user-1' });
    const token = signRefreshToken({
      sub: 'user-1',
      email: 'u@ex.com',
      permissions: 1,
      tierId: 1,
      jti: 'sess-1',
    });
    mockSessionRepo.findById.mockResolvedValue({
      id: 'sess-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000),
      deviceInfo: null,
      ipAddress: null,
      createdAt: new Date(),
    });
    mockUserRepo.findById.mockResolvedValue(user);

    await service.execute(
      { refreshToken: token },
      { deviceInfo: 'Safari', ipAddress: '192.168.1.1' },
    );

    expect(mockSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceInfo: 'Safari',
        ipAddress: '192.168.1.1',
      }),
    );
  });
});
