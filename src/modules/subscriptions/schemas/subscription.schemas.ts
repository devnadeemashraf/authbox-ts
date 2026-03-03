import * as z from 'zod';

/** Confirm checkout session (after redirect from Stripe success page) */
export const confirmCheckoutSessionSchema = z.object({
  sessionId: z.string().min(1, 'sessionId required'),
});
export type ConfirmCheckoutSessionInput = z.infer<typeof confirmCheckoutSessionSchema>;
