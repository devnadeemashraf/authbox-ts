import { createMockDb } from './auth.service.helpers';

import { UserFactory } from '@/__tests__/factories/user.factory';
import { LoginWithEmailService } from '@/modules/auth/services/login-with-email.service';

describe('LoginWithEmailService', () => {
  const mockUserRepo = {
    findByEmail: jest.fn(),
  };

  const mockSessionRepo = {
    create: jest.fn().mockResolvedValue(undefined),
  };

  const mockPasswordHasher = {
    verify: jest.fn(),
    hash: jest.fn(),
  };

  const mockTierEnforcement = {
    enforceSessionLimit: jest.fn().mockResolvedValue(undefined),
  };

  let service: LoginWithEmailService;
  const mockDb = createMockDb();

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LoginWithEmailService(
      mockDb,
      mockUserRepo as never,
      mockSessionRepo as never,
      mockPasswordHasher as never,
      mockTierEnforcement as never,
    );
  });

  it('throws UnauthorizedError when user not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      service.execute({ email: 'nonexistent@example.com', password: 'password123' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    expect(mockPasswordHasher.verify).not.toHaveBeenCalled();
    expect(mockSessionRepo.create).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when user has no passwordHash (OAuth-only)', async () => {
    const oauthUser = UserFactory.build({
      email: 'oauth@example.com',
      passwordHash: null,
    });
    mockUserRepo.findByEmail.mockResolvedValue(oauthUser);

    await expect(
      service.execute({ email: 'oauth@example.com', password: 'any' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });

    expect(mockPasswordHasher.verify).not.toHaveBeenCalled();
    expect(mockSessionRepo.create).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when password is wrong', async () => {
    const user = UserFactory.build({
      email: 'user@example.com',
      passwordHash: '$argon2id$...',
    });
    mockUserRepo.findByEmail.mockResolvedValue(user);
    mockPasswordHasher.verify.mockResolvedValue(false);

    await expect(
      service.execute({ email: 'user@example.com', password: 'wrongpassword' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });

    expect(mockPasswordHasher.verify).toHaveBeenCalledWith('$argon2id$...', 'wrongpassword');
    expect(mockSessionRepo.create).not.toHaveBeenCalled();
  });

  it('returns user and tokens on success', async () => {
    const user = UserFactory.build({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: '$argon2id$...',
    });
    mockUserRepo.findByEmail.mockResolvedValue(user);
    mockPasswordHasher.verify.mockResolvedValue(true);

    const result = await service.execute({
      email: 'user@example.com',
      password: 'SecurePass123!',
    });

    expect(result.user).toEqual(user);
    expect(result.tokens).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    expect(mockTierEnforcement.enforceSessionLimit).toHaveBeenCalledWith(user);
    expect(mockSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        deviceInfo: null,
        ipAddress: null,
      }),
    );
  });

  it('passes deviceInfo and ipAddress to session create', async () => {
    const user = UserFactory.build({ email: 'u@ex.com', passwordHash: 'hash' });
    mockUserRepo.findByEmail.mockResolvedValue(user);
    mockPasswordHasher.verify.mockResolvedValue(true);

    await service.execute(
      { email: 'u@ex.com', password: 'pass' },
      { deviceInfo: 'Mozilla/5.0', ipAddress: '192.168.1.1' },
    );

    expect(mockSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceInfo: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      }),
    );
  });
});
