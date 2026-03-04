import { RevokeSessionService } from '@/modules/auth/services/revoke-session.service';

describe('RevokeSessionService', () => {
  const mockSessionRepo = {
    findById: jest.fn(),
    delete: jest.fn().mockResolvedValue(true),
  };

  let service: RevokeSessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RevokeSessionService(mockSessionRepo as never);
  });

  it('throws NotFoundError when session does not exist', async () => {
    mockSessionRepo.findById.mockResolvedValue(null);

    await expect(service.execute('user-1', 'nonexistent-session')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Session not found',
    });

    expect(mockSessionRepo.delete).not.toHaveBeenCalled();
  });

  it('throws ForbiddenError when session belongs to another user', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 'session-1',
      userId: 'other-user',
      deviceInfo: null,
      ipAddress: null,
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    await expect(service.execute('user-1', 'session-1')).rejects.toMatchObject({
      statusCode: 403,
      message: "Cannot revoke another user's session",
    });

    expect(mockSessionRepo.delete).not.toHaveBeenCalled();
  });

  it('deletes session when user owns it', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      deviceInfo: null,
      ipAddress: null,
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    await service.execute('user-1', 'session-1');

    expect(mockSessionRepo.delete).toHaveBeenCalledWith('session-1');
  });
});
