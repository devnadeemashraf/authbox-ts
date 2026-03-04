import { UserFactory } from '@tests/support/factories/user.factory';

import { UserCache } from '@/infrastructure/cache/user-cache';

describe('UserCache', () => {
  const mockCache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  let service: UserCache;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserCache(mockCache as never);
  });

  it('getById returns null when not cached', async () => {
    mockCache.get.mockResolvedValue(null);

    const result = await service.getById('user-123');

    expect(result).toBeNull();
    expect(mockCache.get).toHaveBeenCalledWith('user:id:user-123');
  });

  it('getById returns User with revived dates when cached', async () => {
    const raw = {
      id: 'u1',
      email: 'u@ex.com',
      username: 'user',
      passwordHash: 'hash',
      isEmailVerified: true,
      avatarUrl: null,
      permissions: 1,
      tierId: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    };
    mockCache.get.mockResolvedValue(raw);

    const result = await service.getById('u1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('u1');
    expect(result!.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    expect(result!.updatedAt).toEqual(new Date('2024-01-02T00:00:00.000Z'));
  });

  it('getByEmail returns null when not cached', async () => {
    mockCache.get.mockResolvedValue(null);

    const result = await service.getByEmail('user@example.com');

    expect(result).toBeNull();
    expect(mockCache.get).toHaveBeenCalledWith('user:email:user@example.com');
  });

  it('set stores user in both id and email keys', async () => {
    const user = UserFactory.build({ id: 'u1', email: 'u@ex.com' });

    await service.set(user);

    expect(mockCache.set).toHaveBeenCalledWith(
      'user:id:u1',
      expect.objectContaining({
        id: 'u1',
        email: 'u@ex.com',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
      expect.any(Number),
    );
    expect(mockCache.set).toHaveBeenCalledWith(
      'user:email:u@ex.com',
      expect.any(Object),
      expect.any(Number),
    );
  });

  it('invalidateUser deletes id key', async () => {
    await service.invalidateUser('user-1');

    expect(mockCache.del).toHaveBeenCalledWith('user:id:user-1');
    expect(mockCache.del).toHaveBeenCalledTimes(1);
  });

  it('invalidateUser with email deletes both keys', async () => {
    await service.invalidateUser('user-1', 'u@ex.com');

    expect(mockCache.del).toHaveBeenCalledWith('user:id:user-1');
    expect(mockCache.del).toHaveBeenCalledWith('user:email:u@ex.com');
    expect(mockCache.del).toHaveBeenCalledTimes(2);
  });
});
