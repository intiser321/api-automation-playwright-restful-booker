import type { JSONSchemaType } from 'ajv';

export type AuthTokenResponse = {
  token: string;
};

export const authTokenResponseSchema: JSONSchemaType<AuthTokenResponse> = {
  type: 'object',
  properties: {
    token: {
      type: 'string'
    }
  },
  required: ['token'],
  additionalProperties: false
};
