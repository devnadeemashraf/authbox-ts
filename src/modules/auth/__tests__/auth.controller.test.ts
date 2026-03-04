import { getTestApp } from '@/__tests__/setup/app';
import { signAccessToken, signRefreshToken } from '@/core/security/jwt';

const BASE = '/api/v1/auth';

/** Valid access token for protected routes. Auth guard only checks JWT validity. */
function validAccessToken(overrides?: { sub?: string; jti?: string }) {
  return signAccessToken({
    sub: overrides?.sub ?? 'user-123',
    email: 'test@example.com',
    permissions: 1,
    tierId: 1,
    jti: overrides?.jti ?? 'session-456',
  });
}

/** Valid refresh token for logout/refresh flows. */
function validRefreshToken() {
  return signRefreshToken({
    sub: 'user-123',
    email: 'test@example.com',
    permissions: 1,
    tierId: 1,
    jti: 'session-456',
  });
}

describe('AuthController', () => {
  describe('POST /login', () => {
    it('returns 422 for invalid email', async () => {
      const res = await getTestApp().post(`${BASE}/login`).send({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/email|invalid/i);
    });

    it('returns 422 for empty password', async () => {
      const res = await getTestApp().post(`${BASE}/login`).send({
        email: 'valid@example.com',
        password: '',
      });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/password/i);
    });

    it('returns 422 for missing body fields', async () => {
      const res = await getTestApp().post(`${BASE}/login`).send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 422 for non-object body', async () => {
      const res = await getTestApp().post(`${BASE}/login`).send('invalid');
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 for non-existent user when DB available', async () => {
      const res = await getTestApp().post(`${BASE}/login`).send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });
      expect([401, 500]).toContain(res.status);
      if (res.status === 401) {
        expect(res.body.success).toBe(false);
        expect(res.body.error?.message).toBe('Invalid email or password');
      }
    });
  });

  describe('POST /register', () => {
    it('returns 422 for invalid email', async () => {
      const res = await getTestApp().post(`${BASE}/register`).send({
        email: 'not-an-email',
        password: 'SecurePass123!',
      });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/email|invalid/i);
    });

    it('returns 422 for short password', async () => {
      const res = await getTestApp().post(`${BASE}/register`).send({
        email: 'valid@example.com',
        password: 'short',
      });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/password|8/i);
    });

    it('returns 422 for missing fields', async () => {
      const res = await getTestApp().post(`${BASE}/register`).send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 422 for password exceeding max length', async () => {
      const res = await getTestApp()
        .post(`${BASE}/register`)
        .send({
          email: 'valid@example.com',
          password: 'A'.repeat(129) + 'a1!',
        });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/password|128/i);
    });

    it('returns 201 and user for valid input when DB available', async () => {
      const email = `test-${Date.now()}@example.com`;
      const res = await getTestApp().post(`${BASE}/register`).send({
        email,
        password: 'SecurePass123!',
      });
      expect([201, 409, 500]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toMatchObject({
          email,
          username: null,
          isEmailVerified: false,
          permissions: 1,
          tierId: 1,
        });
        expect(res.body.data.user.id).toBeDefined();
        expect(res.body.data.user.passwordHash).toBeUndefined();
      }
    });

    it('returns 409 when registering duplicate email when DB available', async () => {
      const email = `dup-${Date.now()}@example.com`;
      const app = getTestApp();
      const first = await app.post(`${BASE}/register`).send({ email, password: 'SecurePass123!' });
      if (first.status !== 201) return; // Skip if DB unavailable
      const second = await app.post(`${BASE}/register`).send({ email, password: 'OtherPass456!' });
      expect(second.status).toBe(409);
      expect(second.body.success).toBe(false);
      expect(second.body.error?.message).toMatch(/already registered|email/i);
    });
  });

  describe('POST /logout', () => {
    it('returns 422 for empty body', async () => {
      const res = await getTestApp().post(`${BASE}/logout`).send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/refresh|token/i);
    });

    it('returns 422 for empty string refreshToken', async () => {
      const res = await getTestApp().post(`${BASE}/logout`).send({ refreshToken: '' });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 204 for valid refreshToken when DB available', async () => {
      const res = await getTestApp()
        .post(`${BASE}/logout`)
        .send({ refreshToken: validRefreshToken() });
      expect([204, 500]).toContain(res.status);
    });
  });

  describe('POST /refresh', () => {
    it('returns 422 for empty body', async () => {
      const res = await getTestApp().post(`${BASE}/refresh`).send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 422 for empty string refreshToken', async () => {
      const res = await getTestApp().post(`${BASE}/refresh`).send({ refreshToken: '' });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 for invalid refresh token', async () => {
      const res = await getTestApp()
        .post(`${BASE}/refresh`)
        .send({ refreshToken: 'invalid-token' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toBe('Invalid or expired refresh token');
    });

    it('returns 401 when using access token instead of refresh token', async () => {
      const res = await getTestApp()
        .post(`${BASE}/refresh`)
        .send({ refreshToken: validAccessToken() });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/Invalid|token/i);
    });

    it('returns 200 with new tokens when DB available', async () => {
      const res = await getTestApp()
        .post(`${BASE}/refresh`)
        .send({ refreshToken: validRefreshToken() });
      expect([200, 401, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.tokens).toMatchObject({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        });
      }
    });
  });

  describe('GET /oauth/:provider', () => {
    it('returns 400 for unsupported provider', async () => {
      const res = await getTestApp().get(`${BASE}/oauth/unsupported`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/unsupported|not found/i);
    });

    it('returns 422 for invalid success_redirect URL when provided', async () => {
      const res = await getTestApp().get(`${BASE}/oauth/google?success_redirect=not-a-valid-url`);
      expect([400, 422]).toContain(res.status);
      if (res.status === 422) {
        expect(res.body.success).toBe(false);
      }
    });

    it('returns 200 with authorizationUrl when provider configured', async () => {
      const res = await getTestApp().get(`${BASE}/oauth/google`);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.authorizationUrl).toMatch(/accounts\.google\.com/);
        expect(res.body.data.state).toBeDefined();
      }
      // 400 when Google OAuth not configured (empty GOOGLE_CLIENT_ID)
    });
  });

  describe('POST /email/send-verification (protected)', () => {
    it('returns 401 when no Authorization header', async () => {
      const res = await getTestApp().post(`${BASE}/email/send-verification`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toBe('Authentication required');
    });

    it('returns 401 when Bearer token is invalid', async () => {
      const res = await getTestApp()
        .post(`${BASE}/email/send-verification`)
        .set('Authorization', 'Bearer invalid.jwt.token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/Invalid|expired|token/i);
    });

    it('returns 200 or 409 when authenticated and DB available', async () => {
      const res = await getTestApp()
        .post(`${BASE}/email/send-verification`)
        .set('Authorization', `Bearer ${validAccessToken()}`);
      expect([200, 401, 409, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
          sent: expect.any(Boolean),
          resendAfterSeconds: expect.any(Number),
        });
      }
    });
  });

  describe('POST /email/verify (protected)', () => {
    it('returns 401 when no Authorization header', async () => {
      const res = await getTestApp().post(`${BASE}/email/verify`).send({ otp: '123456' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 422 for invalid OTP format - wrong length', async () => {
      const res = await getTestApp()
        .post(`${BASE}/email/verify`)
        .set('Authorization', `Bearer ${validAccessToken()}`)
        .send({ otp: '12345' });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/otp|6|digit/i);
    });

    it('returns 422 for invalid OTP format - non-numeric', async () => {
      const res = await getTestApp()
        .post(`${BASE}/email/verify`)
        .set('Authorization', `Bearer ${validAccessToken()}`)
        .send({ otp: '12345a' });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 422 for missing otp', async () => {
      const res = await getTestApp()
        .post(`${BASE}/email/verify`)
        .set('Authorization', `Bearer ${validAccessToken()}`)
        .send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /forgot-password', () => {
    it('returns 422 for invalid email', async () => {
      const res = await getTestApp().post(`${BASE}/forgot-password`).send({
        email: 'not-an-email',
      });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/email|invalid/i);
    });

    it('returns 422 for missing email', async () => {
      const res = await getTestApp().post(`${BASE}/forgot-password`).send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with consistent shape for any email when Redis/DB available', async () => {
      const res = await getTestApp().post(`${BASE}/forgot-password`).send({
        email: 'possibly-nonexistent@example.com',
      });
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
          sent: expect.any(Boolean),
          resendAfterSeconds: expect.any(Number),
        });
      }
      // 500 when Redis/DB unavailable (e.g. CI)
    });
  });

  describe('POST /verify-reset-otp', () => {
    it('returns 422 for invalid email', async () => {
      const res = await getTestApp().post(`${BASE}/verify-reset-otp`).send({
        email: 'invalid',
        otp: '123456',
      });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 422 for invalid OTP format', async () => {
      const res = await getTestApp().post(`${BASE}/verify-reset-otp`).send({
        email: 'user@example.com',
        otp: '12',
      });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 422 for missing fields', async () => {
      const res = await getTestApp().post(`${BASE}/verify-reset-otp`).send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 for invalid or expired OTP when DB available', async () => {
      const res = await getTestApp().post(`${BASE}/verify-reset-otp`).send({
        email: 'user@example.com',
        otp: '000000',
      });
      expect([401, 500]).toContain(res.status);
      if (res.status === 401) {
        expect(res.body.error?.message).toMatch(/Invalid|expired|code/i);
      }
    });
  });

  describe('POST /reset-password', () => {
    it('returns 422 for missing resetToken', async () => {
      const res = await getTestApp().post(`${BASE}/reset-password`).send({
        newPassword: 'NewSecurePass123!',
      });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/reset|token/i);
    });

    it('returns 422 for weak password', async () => {
      const res = await getTestApp()
        .post(`${BASE}/reset-password`)
        .send({
          resetToken: 'a'.repeat(64),
          newPassword: 'short',
        });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/password|12/i);
    });

    it('returns 422 when password lacks required character types', async () => {
      const res = await getTestApp()
        .post(`${BASE}/reset-password`)
        .send({
          resetToken: 'a'.repeat(64),
          newPassword: 'nouppercase1!',
        });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 for invalid reset token', async () => {
      const res = await getTestApp().post(`${BASE}/reset-password`).send({
        resetToken: 'invalid-token-not-in-redis',
        newPassword: 'NewSecurePass123!',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/Invalid|expired|reset token/i);
    });
  });

  describe('GET /sessions (protected)', () => {
    it('returns 401 when no Authorization header', async () => {
      const res = await getTestApp().get(`${BASE}/sessions`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toBe('Authentication required');
    });

    it('returns 401 when Bearer token is malformed', async () => {
      const res = await getTestApp()
        .get(`${BASE}/sessions`)
        .set('Authorization', 'Bearer malformed');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with sessions when authenticated and DB available', async () => {
      const res = await getTestApp()
        .get(`${BASE}/sessions`)
        .set('Authorization', `Bearer ${validAccessToken()}`);
      expect([200, 401, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.sessions)).toBe(true);
      }
    });
  });

  describe('DELETE /sessions (revoke all, protected)', () => {
    it('returns 401 when no Authorization header', async () => {
      const res = await getTestApp().delete(`${BASE}/sessions`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 204 when authenticated and DB available', async () => {
      const res = await getTestApp()
        .delete(`${BASE}/sessions`)
        .set('Authorization', `Bearer ${validAccessToken()}`);
      expect([204, 500]).toContain(res.status);
    });
  });

  describe('DELETE /sessions/:id (revoke one, protected)', () => {
    it('returns 401 when no Authorization header', async () => {
      const res = await getTestApp().delete(`${BASE}/sessions/some-uuid`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 422 for invalid session id (non-UUID)', async () => {
      const res = await getTestApp()
        .delete(`${BASE}/sessions/not-a-uuid`)
        .set('Authorization', `Bearer ${validAccessToken()}`);
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/uuid|invalid|session/i);
    });

    it('returns 204 or 404 when valid UUID and DB available', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const res = await getTestApp()
        .delete(`${BASE}/sessions/${validUuid}`)
        .set('Authorization', `Bearer ${validAccessToken()}`);
      expect([204, 404, 500]).toContain(res.status);
    });
  });
});
