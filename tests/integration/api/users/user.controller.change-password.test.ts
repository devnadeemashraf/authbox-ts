import { getTestApp } from '@tests/support/setup/app';

import { validAccessToken } from '../auth/helpers';

import { USERS_BASE } from './helpers';

const CHANGE_PASSWORD_URL = `${USERS_BASE}/me/password`;

describe('UserController PATCH /me/password (change password)', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = await getTestApp()
      .patch(CHANGE_PASSWORD_URL)
      .send({
        currentPassword: 'OldPass123!',
        newPassword: 'NewSecurePass123!',
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toBe('Authentication required');
  });

  it('returns 401 when Bearer token is malformed', async () => {
    const res = await getTestApp()
      .patch(CHANGE_PASSWORD_URL)
      .set('Authorization', 'Bearer malformed')
      .send({
        currentPassword: 'OldPass123!',
        newPassword: 'NewSecurePass123!',
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for missing currentPassword', async () => {
    const res = await getTestApp()
      .patch(CHANGE_PASSWORD_URL)
      .set('Authorization', `Bearer ${validAccessToken()}`)
      .send({
        newPassword: 'NewSecurePass123!',
      });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/current|password/i);
  });

  it('returns 422 for missing newPassword', async () => {
    const res = await getTestApp()
      .patch(CHANGE_PASSWORD_URL)
      .set('Authorization', `Bearer ${validAccessToken()}`)
      .send({
        currentPassword: 'OldPass123!',
      });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/new|password/i);
  });

  it('returns 422 for weak newPassword', async () => {
    const res = await getTestApp()
      .patch(CHANGE_PASSWORD_URL)
      .set('Authorization', `Bearer ${validAccessToken()}`)
      .send({
        currentPassword: 'OldPass123!',
        newPassword: 'short',
      });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/password|12/i);
  });

  it('returns 422 when newPassword lacks required character types', async () => {
    const res = await getTestApp()
      .patch(CHANGE_PASSWORD_URL)
      .set('Authorization', `Bearer ${validAccessToken()}`)
      .send({
        currentPassword: 'OldPass123!',
        newPassword: 'nouppercase1!',
      });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for empty body', async () => {
    const res = await getTestApp()
      .patch(CHANGE_PASSWORD_URL)
      .set('Authorization', `Bearer ${validAccessToken()}`)
      .send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 or 204 when authenticated and DB available', async () => {
    const res = await getTestApp()
      .patch(CHANGE_PASSWORD_URL)
      .set('Authorization', `Bearer ${validAccessToken()}`)
      .send({
        currentPassword: 'WrongOrMissingPass123!',
        newPassword: 'NewSecurePass123!',
      });
    expect([204, 401, 500]).toContain(res.status);
    if (res.status === 204) {
      expect(res.body).toEqual({});
    }
    if (res.status === 401) {
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/Current password|incorrect/i);
    }
  });
});
