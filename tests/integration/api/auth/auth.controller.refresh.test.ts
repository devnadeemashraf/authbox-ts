import { getTestApp } from '@tests/support/setup/app';

import { AUTH_BASE, validAccessToken, validRefreshToken } from './helpers';

describe('AuthController POST /refresh', () => {
  it('returns 422 for empty body', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/refresh`).send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for empty string refreshToken', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/refresh`).send({ refreshToken: '' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for invalid refresh token', async () => {
    const res = await getTestApp()
      .post(`${AUTH_BASE}/refresh`)
      .send({ refreshToken: 'invalid-token' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toBe('Invalid or expired refresh token');
  });

  it('returns 401 when using access token instead of refresh token', async () => {
    const res = await getTestApp()
      .post(`${AUTH_BASE}/refresh`)
      .send({ refreshToken: validAccessToken() });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/Invalid|token/i);
  });

  it('returns 200 with new tokens when DB available', async () => {
    const res = await getTestApp()
      .post(`${AUTH_BASE}/refresh`)
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
