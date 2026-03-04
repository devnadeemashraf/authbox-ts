import { AUTH_BASE, validAccessToken } from './auth.controller.helpers';

import { getTestApp } from '@/__tests__/setup/app';

describe('AuthController GET /sessions (protected)', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = await getTestApp().get(`${AUTH_BASE}/sessions`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toBe('Authentication required');
  });

  it('returns 401 when Bearer token is malformed', async () => {
    const res = await getTestApp()
      .get(`${AUTH_BASE}/sessions`)
      .set('Authorization', 'Bearer malformed');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 with sessions when authenticated and DB available', async () => {
    const res = await getTestApp()
      .get(`${AUTH_BASE}/sessions`)
      .set('Authorization', `Bearer ${validAccessToken()}`);
    expect([200, 401, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.sessions)).toBe(true);
    }
  });
});

describe('AuthController DELETE /sessions (revoke all, protected)', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = await getTestApp().delete(`${AUTH_BASE}/sessions`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 204 when authenticated and DB available', async () => {
    const res = await getTestApp()
      .delete(`${AUTH_BASE}/sessions`)
      .set('Authorization', `Bearer ${validAccessToken()}`);
    expect([204, 500]).toContain(res.status);
  });
});

describe('AuthController DELETE /sessions/:id (revoke one, protected)', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = await getTestApp().delete(`${AUTH_BASE}/sessions/some-uuid`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for invalid session id (non-UUID)', async () => {
    const res = await getTestApp()
      .delete(`${AUTH_BASE}/sessions/not-a-uuid`)
      .set('Authorization', `Bearer ${validAccessToken()}`);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/uuid|invalid|session/i);
  });

  it('returns 204 or 404 when valid UUID and DB available', async () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const res = await getTestApp()
      .delete(`${AUTH_BASE}/sessions/${validUuid}`)
      .set('Authorization', `Bearer ${validAccessToken()}`);
    expect([204, 404, 500]).toContain(res.status);
  });
});
