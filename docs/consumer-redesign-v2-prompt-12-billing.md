# Consumer Redesign v2 — Prompt 12 billing reference

**Currency:** USD (display currency only; amounts never invented)  
**Consumer plans:** Guest · Free Account · Pro  
**Business plan:** Not offered at launch  
**Price approval status:** **Blocked** — `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_PRO_ANNUAL` empty  
**Paid checkout:** Disabled until Stripe secret + webhook secret + at least one Pro Price ID are configured  

---

## Authoritative chain

```text
Stripe product/price (env Price IDs)
→ POST /api/billing/webhook (signature verified)
→ billing_subscriptions + entitlement snapshot
→ resolveEntitlement(userId)
→ server feature gates (processing / AI / storage / bulk dashboard)
→ pricing + billing UI projections (no browser authority)
```

Checkout success redirect **never** grants paid access by itself.

---

## Plan catalog

Source of truth: `src/server/billing/plan-catalog.ts`

| Code | Checkout | Notes |
| --- | --- | --- |
| `guest` | n/a | Separate guest policy (`guest-policy` / bulk-policy) |
| `free` | n/a | Default authenticated plan |
| `pro` | Target paid plan | Requires `STRIPE_PRICE_PRO_*` |
| `professional` | Legacy alias of `pro` | Inactive for new checkout |
| `starter` / `agency` | Inactive | Not sold on consumer pricing |

### Guest (public tools)

| Capability | Value |
| --- | --- |
| Ops / rolling 24h | 5 (env `GUEST_MAX_OPS_PER_DAY`) |
| Max file | 10 MiB |
| Bulk files | 5 |
| Bulk batch | 25 MiB |
| ZIP | Yes (permitted bulk jobs) |
| Retention | 1 hour |
| `bulkAi` | **false** |
| AI live | Provider required; currently **Blocked** without key |

Signed-in visitors on **public** bulk get elevated caps (20 files / 80 MiB) without a paid subscription.

### Free Account

| Capability | Approx limit |
| --- | --- |
| Projects | 5 |
| Monthly processing | 200 |
| Monthly AI | 50 (provider still required) |
| Monthly export | 20 |
| Bulk processing (dashboard) | Enabled |
| Storage | Project quota defaults |
| `bulkAi` (dashboard AI batches) | Policy remains authenticated `bulkAi: true` with monthly AI counter |
| Consumer pricing card `bulkAi` | Shown **false** for Free (honest commercial gate) |

### Pro

| Capability | Approx limit |
| --- | --- |
| Projects | 50 |
| Monthly processing | 10_000 |
| Monthly AI | 2_000 |
| Monthly export | 500 |
| Original/generated storage | 20 GiB each |
| Pricing-card bulk files/batch | 50 / 200 MiB (public projection) |
| Price IDs | `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL` |

Dollar amounts are **not** shown until Price IDs are configured and amounts are approved separately.

---

## Entitlement status mapping

`mapEntitlementState` in `billing-policy.ts`:

| Stripe status | Entitlement |
| --- | --- |
| `trialing`, `active` | `enabled` (until cancel-at-period-end expires) |
| `past_due` + grace not ended | `grace_period` |
| `past_due` after grace | `restricted` |
| `unpaid`, `canceled`, `incomplete*`, `paused`, unknown | `disabled` → Free fallback |

---

## Routes

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/billing/checkout` | Auth required; interval `month`\|`year`; server resolves Price ID |
| POST | `/api/billing/portal` | Auth + existing Stripe customer |
| GET | `/api/billing/summary` | Safe account + usage projection |
| POST | `/api/billing/webhook` | Raw body + `stripe-signature` |

Webhook events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`.

Idempotency: `stripe_events.stripeEventId` unique.

---

## UI

- `/[locale]/pricing` — Guest / Free / Pro from `getPublicPricingView()`
- `/[locale]/dashboard/settings/billing` — plan, status, usage, upgrade/manage
- `/[locale]/dashboard/settings/billing/success` — “confirming payment”; polls local entitlement (no grant from `session_id`)

---

## Upgrade / downgrade

1. Upgrade activates only after webhook writes eligible subscription state.
2. Cancel-at-period-end keeps Pro until `currentPeriodEnd`.
3. After expire/delete → Free snapshot; existing files remain readable; new uploads blocked when over Free quota (quota services).
4. No automatic surprise deletion.

---

## AI entitlement

- Allowance checked before provider call.
- Subscription does **not** bypass missing provider configuration.
- Guest AI is ops-gated + provider-gated; live generation remains Blocked until a real OpenAI success.
- Pricing labels AI as requiring a configured provider.

---

## Environment

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_ANNUAL=
STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID=   # optional
NEXT_PUBLIC_APP_URL=
CRON_SECRET=                               # cleanup HTTP (alias CLEANUP_CRON_SECRET)
```

Secret keys are server-only. App builds and serves when Stripe is empty (paid CTA disabled).
