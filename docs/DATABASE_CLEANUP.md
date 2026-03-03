# Database Cleanup Worker

A scheduled worker that keeps the database tidy by removing expired and obsolete records.

## Schedule

Runs **daily at 03:00 UTC** (cron: `0 3 * * *`).

## What It Cleans

| Table                   | Condition                          | Purpose                                      |
| ----------------------- | ---------------------------------- | -------------------------------------------- |
| `sessions`              | `expiresAt < now()`                | Expired refresh-token sessions               |
| `verification_tokens`   | `expiresAt < now()`                | Expired email verification & password reset  |
| `processed_stripe_events` | `processedAt < now() - 90 days`  | Old webhook idempotency records (retention)  |

## Why

- **Sessions**: Expired sessions are never used; they accumulate over time.
- **Verification tokens**: One-time use; expired ones are useless.
- **Processed Stripe events**: Idempotency only needs a finite window; 90 days is sufficient.

## Queue

`database-cleanup` — scheduled via `scheduleSubscriptionJobs()` in worker startup.
