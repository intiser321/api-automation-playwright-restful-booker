import type { APIRequestContext } from '@playwright/test';
import { authTokenResponseSchema } from '../schemas/authSchemas';
import { validateSchema } from './schemaValidator';

export async function createAuthToken(request: APIRequestContext): Promise<string> {
  const authResponse = await request.post('/auth', {
    data: {
      username: 'admin',
      password: 'password123'
    }
  });

  if (!authResponse.ok()) {
    throw new Error(`Auth request failed with status ${authResponse.status()}`);
  }

  const authResponseBody = validateSchema(authTokenResponseSchema, await authResponse.json());

  if (authResponseBody.token.length === 0) {
    throw new Error('Auth token was not returned in the response body.');
  }

  return authResponseBody.token;
}
