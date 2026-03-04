import { ListSessionsService } from '@/modules/auth/services/list-sessions.service';

describe('ListSessionsService', () => {
  const mockSessionRepo = {
    findActiveByUserId: jest.fn(),
  };

  let service: ListSessionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ListSessionsService(mockSessionRepo as never);
  });

  it('returns sessions with isCurrent flag for matching jti', async () => {
    const sessions = [
      {
        id: 'session-1',
        userId: 'user-1',
        deviceInfo: 'Chrome',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date('2025-01-01'),
      },
      {
        id: 'session-2',
        userId: 'user-1',
        deviceInfo: 'Safari',
        ipAddress: '192.168.1.1',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date('2025-01-02'),
      },
    ];
    mockSessionRepo.findActiveByUserId.mockResolvedValue(sessions);

    const result = await service.execute('user-1', 'session-2');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'session-1',
      deviceInfo: 'Chrome',
      ipAddress: '127.0.0.1',
      isCurrent: false,
    });
    expect(result[1]).toMatchObject({
      id: 'session-2',
      deviceInfo: 'Safari',
      ipAddress: '192.168.1.1',
      isCurrent: true,
    });
    expect(mockSessionRepo.findActiveByUserId).toHaveBeenCalledWith('user-1');
  });

  it('returns empty array when no sessions', async () => {
    mockSessionRepo.findActiveByUserId.mockResolvedValue([]);

    const result = await service.execute('user-1', 'current-jti');

    expect(result).toEqual([]);
  });
});
