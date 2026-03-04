import { TierEnforcementService } from '@/modules/auth/services/tier-enforcement.service';

describe('TierEnforcementService', () => {
  const mockSessionRepo = {
    countActiveByUserId: jest.fn(),
  };

  let service: TierEnforcementService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TierEnforcementService(mockSessionRepo as never);
  });

  it('resolves when active count is below limit', async () => {
    mockSessionRepo.countActiveByUserId.mockResolvedValue(0);

    await service.enforceSessionLimit({ id: 'user-1', tierId: 1 });

    expect(mockSessionRepo.countActiveByUserId).toHaveBeenCalledWith('user-1');
  });

  it('throws ForbiddenError when at max sessions (free tier = 1)', async () => {
    mockSessionRepo.countActiveByUserId.mockResolvedValue(1);

    await expect(service.enforceSessionLimit({ id: 'user-1', tierId: 1 })).rejects.toMatchObject({
      statusCode: 403,
      message: 'Maximum 1 active session(s) allowed. Please revoke one before logging in.',
    });
  });

  it('throws ForbiddenError when premium user at limit (3)', async () => {
    mockSessionRepo.countActiveByUserId.mockResolvedValue(3);

    await expect(service.enforceSessionLimit({ id: 'user-1', tierId: 2 })).rejects.toMatchObject({
      statusCode: 403,
      message: 'Maximum 3 active session(s) allowed. Please revoke one before logging in.',
    });
  });

  it('uses tier 1 defaults when tierId unknown', async () => {
    mockSessionRepo.countActiveByUserId.mockResolvedValue(1);

    await expect(service.enforceSessionLimit({ id: 'user-1', tierId: 99 })).rejects.toMatchObject({
      message: expect.stringContaining('Maximum 1 active session'),
    });
  });
});
