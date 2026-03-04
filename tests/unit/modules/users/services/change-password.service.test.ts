import { UserFactory } from '@tests/support/factories/user.factory';

import { ChangePasswordService } from '@/modules/users/services/change-password.service';

/** Chainable mock for Knex trx(table).where().whereNot().update() / del() */
function createMockTrx() {
  const chain = {
    where: jest.fn().mockReturnThis(),
    whereNot: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
  };
  return jest.fn(() => chain);
}

describe('ChangePasswordService', () => {
  const mockUserRepo = {
    findById: jest.fn(),
  };

  const mockPasswordHasher = {
    verify: jest.fn(),
    hash: jest.fn().mockResolvedValue('$argon2id$newhash'),
  };

  const mockTrx = createMockTrx();
  const mockDb = {
    transaction: jest.fn((cb: (trx: ReturnType<typeof createMockTrx>) => Promise<void>) =>
      cb(mockTrx),
    ),
  };

  let service: ChangePasswordService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChangePasswordService(
      mockDb as never,
      mockUserRepo as never,
      mockPasswordHasher as never,
    );
  });

  it('throws UnauthorizedError when user not found', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      service.execute('user-123', 'session-456', {
        currentPassword: 'OldPass123!',
        newPassword: 'NewSecurePass123!',
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'User not found',
    });

    expect(mockPasswordHasher.verify).not.toHaveBeenCalled();
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when user has no passwordHash (OAuth-only)', async () => {
    const oauthUser = UserFactory.build({ id: 'user-1', passwordHash: null });
    mockUserRepo.findById.mockResolvedValue(oauthUser);

    await expect(
      service.execute('user-1', 'session-1', {
        currentPassword: 'any',
        newPassword: 'NewSecurePass123!',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringMatching(/social sign-in|forgot-password/i),
    });

    expect(mockPasswordHasher.verify).not.toHaveBeenCalled();
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when current password is wrong', async () => {
    const user = UserFactory.build({
      id: 'user-1',
      passwordHash: '$argon2id$...',
    });
    mockUserRepo.findById.mockResolvedValue(user);
    mockPasswordHasher.verify.mockResolvedValue(false);

    await expect(
      service.execute('user-1', 'session-1', {
        currentPassword: 'WrongPass123!',
        newPassword: 'NewSecurePass123!',
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Current password is incorrect',
    });

    expect(mockPasswordHasher.verify).toHaveBeenCalledWith('$argon2id$...', 'WrongPass123!');
    expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('updates password and revokes other sessions on success', async () => {
    const user = UserFactory.build({
      id: 'user-1',
      passwordHash: '$argon2id$old',
    });
    mockUserRepo.findById.mockResolvedValue(user);
    mockPasswordHasher.verify.mockResolvedValue(true);

    await service.execute('user-1', 'session-current', {
      currentPassword: 'OldPass123!',
      newPassword: 'NewSecurePass123!',
    });

    expect(mockPasswordHasher.verify).toHaveBeenCalledWith('$argon2id$old', 'OldPass123!');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('NewSecurePass123!');
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockTrx).toHaveBeenCalledWith('users');
    expect(mockTrx).toHaveBeenCalledWith('sessions');
  });

  it('resolves without throw on success', async () => {
    const user = UserFactory.build({ id: 'u1', passwordHash: 'hash' });
    mockUserRepo.findById.mockResolvedValue(user);
    mockPasswordHasher.verify.mockResolvedValue(true);

    await expect(
      service.execute('u1', 'sess-1', {
        currentPassword: 'CurrentPass123!',
        newPassword: 'NewSecurePass123!',
      }),
    ).resolves.toBeUndefined();

    expect(mockPasswordHasher.hash).toHaveBeenCalled();
    expect(mockDb.transaction).toHaveBeenCalled();
  });
});
