import { Permissions } from '@/core/security/permissions';
import { RegisterWithEmailService } from '@/modules/auth/services/register-with-email.service';

import { createMockDb } from './helpers';

const DEFAULT_PERMISSIONS = Permissions.UPDATE_PROFILE | Permissions.UPLOAD_AVATAR;

describe('RegisterWithEmailService', () => {
  const mockUserRepo = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockPasswordHasher = {
    hash: jest.fn().mockResolvedValue('$argon2id$hashed'),
    verify: jest.fn(),
  };

  const mockQueueWelcomeEmail = {
    execute: jest.fn().mockResolvedValue(undefined),
  };

  let service: RegisterWithEmailService;
  const mockDb = createMockDb();

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RegisterWithEmailService(
      mockDb,
      mockUserRepo as never,
      mockPasswordHasher as never,
      mockQueueWelcomeEmail as never,
    );
  });

  it('throws ConflictError when email already exists', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ id: 'existing', email: 'taken@example.com' });

    await expect(
      service.execute({ email: 'taken@example.com', password: 'SecurePass123!' }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Email already registered',
    });

    expect(mockUserRepo.create).not.toHaveBeenCalled();
    expect(mockQueueWelcomeEmail.execute).not.toHaveBeenCalled();
  });

  it('creates user and queues welcome email on success', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    const createdUser = {
      id: 'new-user-id',
      email: 'new@example.com',
      username: null,
      passwordHash: '$argon2id$hashed',
      isEmailVerified: false,
      permissions: 1,
      tierId: 1,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUserRepo.create.mockResolvedValue(createdUser);

    const result = await service.execute({
      email: 'New@Example.COM',
      password: 'SecurePass123!',
    });

    expect(result.user).toEqual(createdUser);
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('SecurePass123!');
    expect(mockUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        isEmailVerified: false,
        permissions: DEFAULT_PERMISSIONS,
        tierId: 1,
      }),
    );
    expect(mockQueueWelcomeEmail.execute).toHaveBeenCalledWith('new@example.com');
  });

  it('normalizes email to lowercase', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockImplementation((data: { email: string }) =>
      Promise.resolve({ ...data, id: 'x', createdAt: new Date(), updatedAt: new Date() } as never),
    );

    await service.execute({ email: 'UPPER@Example.COM', password: 'SecurePass123!' });

    expect(mockUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'upper@example.com',
      }),
    );
  });
});
