import { UserFactory } from './user.factory';

describe('UserFactory', () => {
  it('builds a user with default values', () => {
    const user = UserFactory.build();
    expect(user.id).toBeDefined();
    expect(user.email).toMatch(/^user-[a-f0-9]+@example\.com$/);
    expect(user.username).toMatch(/^user_[a-f0-9]+$/);
    expect(user.isEmailVerified).toBe(false);
    expect(user.permissions).toBe(1);
    expect(user.tierId).toBe(1);
  });

  it('builds a user with overrides', () => {
    const user = UserFactory.build({
      email: 'custom@example.com',
      isEmailVerified: true,
    });
    expect(user.email).toBe('custom@example.com');
    expect(user.isEmailVerified).toBe(true);
  });

  it('generates unique ids per call', () => {
    const a = UserFactory.build();
    const b = UserFactory.build();
    expect(a.id).not.toBe(b.id);
    expect(a.email).not.toBe(b.email);
  });
});
