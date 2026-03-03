import { ValidationError } from '@/core/errors/client-errors';

type SchemaWithSafeParse<T> = {
  safeParse: (
    data: unknown,
  ) => { success: true; data: T } | { success: false; error: { issues: unknown[] } };
};

/**
 * Validates input against a Zod schema. Throws ValidationError on failure.
 */
export function validateWithZod<T>(schema: SchemaWithSafeParse<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues;
    const firstError = issues[0] as { path: (string | number)[]; message: string } | undefined;
    const message = firstError
      ? `${firstError.path.join('.')}: ${firstError.message}`
      : 'Validation failed';
    throw new ValidationError({ message, details: { issues } });
  }
  return result.data;
}
