import { expect, test } from '@playwright/test';

test('TC7 - POST /auth should create an auth token', async ({ request }) => {
  const authPayload = {
    username: 'admin',
    password: 'password123'
  };

  const response = await request.post('/auth', {
    data: authPayload
  });

  expect(response.status()).toBe(200);

  const responseBody = await response.json();

  expect(responseBody).toHaveProperty('token');
  expect(typeof responseBody.token).toBe('string');
  expect(responseBody.token.length).toBeGreaterThan(0);
});
