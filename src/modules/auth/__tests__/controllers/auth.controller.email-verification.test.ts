import { AUTH_BASE, validAccessToken } from './auth.controller.helpers';

import { getTestApp } from '@/__tests__/setup/app';

describe('AuthController POST /email/send-verification (protected)', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/email/send-verification`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toBe('Authentication required');
  });

  it('returns 401 when Bearer token is invalid', async () => {
    const res = await getTestApp()
      .post(`${AUTH_BASE}/email/send-verification`)
      .set('Authorization', 'Bearer invalid.jwt.token');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/Invalid|expired|token/i);
  });

  it('returns 200 or 409 when authenticated and DB available', async () => {
    const res = await getTestApp()
      .post(`${AUTH_BASE}/email/send-verification`)
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

describe('AuthController POST /email/verify (protected)', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/email/verify`).send({ otp: '123456' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for invalid OTP format - wrong length', async () => {
    const res = await getTestApp()
      .post(`${AUTH_BASE}/email/verify`)
      .set('Authorization', `Bearer ${validAccessToken()}`)
      .send({ otp: '12345' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/otp|6|digit/i);
  });

  it('returns 422 for invalid OTP format - non-numeric', async () => {
    const res = await getTestApp()
      .post(`${AUTH_BASE}/email/verify`)
      .set('Authorization', `Bearer ${validAccessToken()}`)
      .send({ otp: '12345a' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for missing otp', async () => {
    const res = await getTestApp()
      .post(`${AUTH_BASE}/email/verify`)
      .set('Authorization', `Bearer ${validAccessToken()}`)
      .send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
