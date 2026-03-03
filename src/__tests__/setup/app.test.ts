import { getTestApp } from './app';

describe('Test setup', () => {
  it('getTestApp returns supertest agent', () => {
    const agent = getTestApp();
    expect(agent.get).toBeDefined();
    expect(agent.post).toBeDefined();
  });

  it('health endpoint returns 200', async () => {
    const res = await getTestApp().get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
  });
});
