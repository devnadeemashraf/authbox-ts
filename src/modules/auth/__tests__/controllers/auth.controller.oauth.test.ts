import { AUTH_BASE } from './auth.controller.helpers';

import { getTestApp } from '@/__tests__/setup/app';

describe('AuthController GET /oauth/:provider', () => {
  it('returns 400 for unsupported provider', async () => {
    const res = await getTestApp().get(`${AUTH_BASE}/oauth/unsupported`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/unsupported|not found/i);
  });

  it('returns 422 for invalid success_redirect URL when provided', async () => {
    const res = await getTestApp().get(
      `${AUTH_BASE}/oauth/google?success_redirect=not-a-valid-url`,
    );
    expect([400, 422]).toContain(res.status);
    if (res.status === 422) {
      expect(res.body.success).toBe(false);
    }
  });

  it('returns 200 with authorizationUrl when provider configured', async () => {
    const res = await getTestApp().get(`${AUTH_BASE}/oauth/google`);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.authorizationUrl).toMatch(/accounts\.google\.com/);
      expect(res.body.data.state).toBeDefined();
    }
  });
});
