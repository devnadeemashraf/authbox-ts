# Payment & Subscription System Design

## 1. Security Model (No Hacky Upgrades)

**Core principle:** Tier upgrades happen **only** when Stripe confirms payment. The client never tells the backend "upgrade me."

| Flow | Who triggers | What happens |
|------|--------------|--------------|
| Checkout | User clicks "Upgrade" | API creates Stripe Checkout Session → redirects to Stripe-hosted payment page |
| Payment success | Stripe | Stripe charges card → sends `customer.subscription.created` / `updated` webhook |
| Tier upgrade | Webhook handler | Verifies Stripe signature → updates `subscriptions` + `users.tierId` |

**Why it's secure:**
- Webhook uses `Stripe-Signature` header; we verify with `STRIPE_WEBHOOK_SECRET`. Forged webhooks fail.
- Idempotency: we store `stripeEventId` and skip duplicate processing.
- No API endpoint accepts "set my tier to premium" — only the webhook does.

---

## 2. Database Schema

### `subscriptions`
Tracks current subscription state per user. One active subscription per user.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | PK |
| userId | UUID | FK → users |
| stripeCustomerId | VARCHAR | Stripe Customer ID |
| stripeSubscriptionId | VARCHAR | Stripe Subscription ID (unique) |
| tierId | INTEGER | FK → tiers (premium = 2) |
| status | VARCHAR | active, canceled, past_due, trialing, unpaid |
| currentPeriodStart | TIMESTAMPTZ | Billing period start |
| currentPeriodEnd | TIMESTAMPTZ | Billing period end |
| cancelAtPeriodEnd | BOOLEAN | User requested cancel at end |
| renewalReminderSentAt | TIMESTAMPTZ | When we sent "renew soon" email |
| createdAt, updatedAt | TIMESTAMPTZ | Audit |

### `payments`
Audit trail for every payment. Full traceability.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | PK |
| subscriptionId | UUID | FK → subscriptions |
| stripeInvoiceId | VARCHAR | Stripe Invoice ID |
| stripePaymentIntentId | VARCHAR | Optional |
| amountCents | INTEGER | Amount in cents |
| currency | VARCHAR(3) | e.g. usd |
| status | VARCHAR | succeeded, failed, refunded |
| paidAt | TIMESTAMPTZ | When payment completed |
| metadata | JSONB | Extra data |
| createdAt | TIMESTAMPTZ | Audit |

### `processed_stripe_events`
Idempotency for webhooks. Prevents duplicate processing on retries.

| Column | Type | Purpose |
|--------|------|---------|
| stripeEventId | VARCHAR(255) UNIQUE | Stripe event `evt_xxx` |
| processedAt | TIMESTAMPTZ | When we processed it |

---

## 3. Renewal & Demotion Flow

| Event | Timing | Action |
|-------|--------|--------|
| **Reminder** | 7 days before `currentPeriodEnd` | Worker finds subscriptions where `currentPeriodEnd` is in next 7 days and `renewalReminderSentAt` is null → send email, set `renewalReminderSentAt` |
| **Grace period** | Up to 7 days after `currentPeriodEnd` | User can still renew; Stripe may retry. No demotion yet. |
| **Demotion** | 7 days after `currentPeriodEnd` | Worker finds subscriptions where `currentPeriodEnd < now - 7 days` AND `status IN ('canceled','past_due','unpaid')` → set `users.tierId = 1` (free) |

Stripe handles retries. If payment eventually succeeds, we get `customer.subscription.updated` and keep premium. If it fails, status becomes `past_due`/`canceled` and we demote after the grace period.

---

## 4. Worker Jobs (BullMQ Repeatable)

| Queue | Schedule | Processor |
|-------|----------|-----------|
| `subscription-renewal-reminder` | Daily 09:00 UTC | Send reminder emails |
| `subscription-demotion` | Daily 09:00 UTC | Demote expired subscriptions |

---

## 5. API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /api/v1/subscriptions/checkout | Yes | Create Stripe Checkout Session, return `{ url }` |
| POST | /api/v1/subscriptions/confirm-session | Yes | **Local dev fallback**: Confirm session after redirect (body: `{ sessionId }`) |
| GET | /api/v1/subscriptions/status | Yes | Return current subscription + payment history |
| POST | /api/v1/webhooks/stripe | No (Stripe only) | Raw body; verify signature; process events |

Webhook route must use **raw body** — Stripe signature verification requires the unparsed body.

### Local development: two ways to fulfill

1. **Stripe CLI (recommended)**: Run `stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe`. Use the printed `whsec_...` as `STRIPE_WEBHOOK_SECRET`. Webhooks will reach your server automatically.

2. **Confirm-session fallback**: If not using stripe listen, have your frontend call `POST /api/v1/subscriptions/confirm-session` with `{ sessionId }` when the user lands on the success page (with `session_id` from the URL). This verifies the session and fulfills the subscription.
