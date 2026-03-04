import { RevokeAllSessionsService } from '@/modules/auth/services/revoke-all-sessions.service';

describe('RevokeAllSessionsService', () => {
  const mockSessionRepo = {
    deleteByUserId: jest.fn().mockResolvedValue(3),
  };

  let service: RevokeAllSessionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RevokeAllSessionsService(mockSessionRepo as never);
  });

  it('calls deleteByUserId with user id', async () => {
    await service.execute('user-123');

    expect(mockSessionRepo.deleteByUserId).toHaveBeenCalledWith('user-123');
  });

  it('resolves without throw', async () => {
    await expect(service.execute('user-1')).resolves.toBeUndefined();
  });
});
