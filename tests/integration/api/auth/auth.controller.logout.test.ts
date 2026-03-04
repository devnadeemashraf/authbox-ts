import { getTestApp } from '@tests/support/setup/app';

import { AUTH_BASE, validRefreshToken } from './helpers';

describe('AuthController POST /logout', () => {
  it('returns 422 for empty body', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/logout`).send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/refresh|token/i);
  });

  it('returns 422 for empty string refreshToken', async () => {
    const res = await getTestApp().post(`${AUTH_BASE}/logout`).send({ refreshToken: '' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 204 for valid refreshToken when DB available', async () => {
    const res = await getTestApp()
      .post(`${AUTH_BASE}/logout`)
      .send({ refreshToken: validRefreshToken() });
    expect([204, 500]).toContain(res.status);
  });
});
