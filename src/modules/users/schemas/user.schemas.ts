import * as z from 'zod';

/** Username: 3–30 chars, alphanumeric + underscore. Unique (checked in service). */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric or underscore only');

export const updateMeSchema = z.object({
  username: z.union([usernameSchema, z.literal('').transform(() => null), z.null()]).optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
