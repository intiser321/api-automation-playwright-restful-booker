import { expect, test } from '@playwright/test';
import { validateSchema } from '../../src/helpers/schemaValidator';
import { authTokenResponseSchema } from '../../src/schemas/authSchemas';

test('TC7 - POST /auth should create an auth token @smoke @regression @auth', async ({
  request
}) => {
  const authPayload = {
    username: 'admin',
    password: 'password123'
  };

  const response = await request.post('/auth', {
    data: authPayload
  });

  expect(response.status()).toBe(200);

  const responseBody = validateSchema(authTokenResponseSchema, await response.json());

  expect(responseBody.token.length).toBeGreaterThan(0);
});
