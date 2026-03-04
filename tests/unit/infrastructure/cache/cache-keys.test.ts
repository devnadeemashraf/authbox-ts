import { CacheKeys } from '@/infrastructure/cache/cache-keys';

describe('CacheKeys', () => {
  it('session() returns namespaced key', () => {
    expect(CacheKeys.session('sess-123')).toBe('session:sess-123');
  });

  it('userSessions() returns namespaced key', () => {
    expect(CacheKeys.userSessions('user-456')).toBe('user:sessions:user-456');
  });

  it('userById() returns namespaced key', () => {
    expect(CacheKeys.userById('user-789')).toBe('user:id:user-789');
  });

  it('userByEmail() normalizes email to lowercase', () => {
    expect(CacheKeys.userByEmail('User@Example.COM')).toBe('user:email:user@example.com');
  });

  it('userByIdPattern() returns pattern for bulk invalidation', () => {
    expect(CacheKeys.userByIdPattern()).toBe('user:id:*');
  });

  it('userByEmailPattern() returns pattern for bulk invalidation', () => {
    expect(CacheKeys.userByEmailPattern()).toBe('user:email:*');
  });
});
