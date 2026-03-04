import { VerifyEmailOtpService } from '@/modules/auth/services/verify-email-otp.service';

import { createMockDb } from './helpers';

describe('VerifyEmailOtpService', () => {
  const mockVerificationTokenRepo = {
    findValidByUserIdAndType: jest.fn(),
  };

  const mockPasswordHasher = {
    verify: jest.fn(),
    hash: jest.fn(),
  };

  let service: VerifyEmailOtpService;
  const mockDb = createMockDb();

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VerifyEmailOtpService(
      mockDb,
      mockVerificationTokenRepo as never,
      mockPasswordHasher as never,
    );
  });

  it('throws UnauthorizedError when no valid token exists', async () => {
    mockVerificationTokenRepo.findValidByUserIdAndType.mockResolvedValue(null);

    await expect(service.execute('user-123', '123456')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or expired verification code',
    });

    expect(mockVerificationTokenRepo.findValidByUserIdAndType).toHaveBeenCalledWith(
      'user-123',
      'email_verify',
    );
    expect(mockPasswordHasher.verify).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when OTP does not match', async () => {
    mockVerificationTokenRepo.findValidByUserIdAndType.mockResolvedValue({
      id: 'token-1',
      userId: 'user-123',
      tokenHash: '$argon2id$...',
    });
    mockPasswordHasher.verify.mockResolvedValue(false);

    await expect(service.execute('user-123', '000000')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or expired verification code',
    });

    expect(mockPasswordHasher.verify).toHaveBeenCalledWith('$argon2id$...', '000000');
  });

  it('resolves without throw when OTP is valid', async () => {
    const token = { id: 'token-1', userId: 'user-123', tokenHash: '$argon2id$...' };
    mockVerificationTokenRepo.findValidByUserIdAndType.mockResolvedValue(token);
    mockPasswordHasher.verify.mockResolvedValue(true);

    const chain = {
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(1),
    };
    const trx = jest.fn().mockReturnValue(chain);
    (mockDb.transaction as jest.Mock).mockImplementation(
      async (cb: (t: (table: string) => typeof chain) => Promise<void>) => cb(trx),
    );

    await service.execute('user-123', '123456');

    expect(mockPasswordHasher.verify).toHaveBeenCalledWith('$argon2id$...', '123456');
    expect(mockDb.transaction).toHaveBeenCalled();
  });
});
