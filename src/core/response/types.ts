/**
 * Predictable API response structure. Controllers and Services align on these shapes.
 * Services return `T`; Controllers use helpers to wrap as SuccessResponse<T> and send.
 */

/** Success status codes used by response helpers */
export const SuccessStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
} as const;

/** Standard success payload – Controller wraps service result in this */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/** Success with meta (pagination, counts, etc.) */
export interface SuccessResponseWithMeta<T, M = Record<string, unknown>> {
  success: true;
  data: T;
  meta: M;
}

/** Union of all success shapes – client can rely on success: true */
export type ApiSuccess<T, M = never> =
  M extends Record<string, unknown> ? SuccessResponseWithMeta<T, M> : SuccessResponse<T>;
