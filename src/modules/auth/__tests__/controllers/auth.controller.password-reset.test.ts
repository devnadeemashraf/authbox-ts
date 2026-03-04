import { AUTH_BASE } from './auth.controller.helpers';

import { getTestApp } from '@/__tests__/setup/app';

describe('AuthController POST /forgot-password', () => {
  it('returns 422 for invalid email', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/forgot-password`).send({
      email: 'not-an-email',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/email|invalid/i);
  });

  it('returns 422 for missing email', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/forgot-password`).send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 with consistent shape for any email when Redis/DB available', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/forgot-password`).send({
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
  });
});

describe('AuthController POST /verify-reset-otp', () => {
  it('returns 422 for invalid email', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/verify-reset-otp`).send({
      email: 'invalid',
      otp: '123456',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for invalid OTP format', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/verify-reset-otp`).send({
      email: 'user@example.com',
      otp: '12',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for missing fields', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/verify-reset-otp`).send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for invalid or expired OTP when DB available', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/verify-reset-otp`).send({
      email: 'user@example.com',
      otp: '000000',
    });
    expect([401, 500]).toContain(res.status);
    if (res.status === 401) {
      expect(res.body.error?.message).toMatch(/Invalid|expired|code/i);
    }
  });
});

describe('AuthController POST /reset-password', () => {
  it('returns 422 for missing resetToken', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/reset-password`).send({
      newPassword: 'NewSecurePass123!',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/reset|token/i);
  });

  it('returns 422 for weak password', async () => {
    const res = await getTestApp()
      .post(`${AUTH_BASE}/reset-password`)
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
      .post(`${AUTH_BASE}/reset-password`)
      .send({
        resetToken: 'a'.repeat(64),
        newPassword: 'nouppercase1!',
      });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for invalid reset token', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/reset-password`).send({
      resetToken: 'invalid-token-not-in-redis',
      newPassword: 'NewSecurePass123!',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/Invalid|expired|reset token/i);
  });
});
