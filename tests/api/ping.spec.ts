import { expect, test } from '@playwright/test';

test('TC1 - GET /ping should confirm API is alive', async function ({ request }) {
  const response = await request.get('/ping');
  expect(response.status()).toBe(201);
});
