import Ajv, { type JSONSchemaType } from 'ajv';

const ajv = new Ajv({ allErrors: true });

export function validateSchema<T>(schema: JSONSchemaType<T>, data: unknown): T {
  const validate = ajv.compile(schema);

  if (!validate(data)) {
    throw new Error(`Schema validation failed: ${ajv.errorsText(validate.errors)}`);
  }

  return data as T;
}
