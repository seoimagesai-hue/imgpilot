# Consumer Redesign v2 — Prompt 12 inspection

**Date:** 2026-08-03  
**Status:** Inspection complete — **implementation followed this report**  
**Post-implementation BUILD_ID:** `YeeLolPhdySYkNWTqVbCI` (Prompt 12 rebuild)  
**Pre-P12 cutover BUILD_ID (historical):** `cBA-_N_Bki5mMQqy78Jxl`  
**Rollback build:** `.next-pre-v2-cutover` (`6RV1arlMI2rIKw68Qghu-`) — retain  
**Operator choices:** Plan shape **Guest + Free Account + Pro**; currency **USD**; **Price IDs empty → paid launch Blocked**; build plumbing + free-launch readiness.

---

## Executive summary

Commercial billing is **schema- and catalog-scaffolded** but **Stripe runtime is unwired**. Live DB already has billing tables (`billing_accounts`, `billing_subscriptions`, `billing_entitlement_snapshots`, `billing_usage_ledger`, `stripe_events`). Application code has `plan-catalog.ts` and `entitlements.ts`, but:

- No `stripe` SDK usage in `src/`
- Billing API route directories are **empty** (checkout / portal / webhook / summary)
- Pricing page and dashboard billing pages are **empty**
- `billing-customers.ts` and `mapEntitlementState` are **stubs**
- Stripe env vars and Price IDs are **missing**
- Cleanup is a **CLI worker only**; `/api/health/scheduler` always `skipped`
- No Playwright suite for consumer tools (EN/UR/mobile/keyboard)

**Recommended Prompt 12 outcome if Stripe stays unconfigured:**  
**Ready for public free launch — paid launch Blocked**  
(with safe disabled-billing architecture, cron authenticated endpoint + verified invoke, Playwright consumer suite, and honest pricing page).

---

## What Stripe functionality already exists

| Area | Status |
| --- | --- |
| `stripe` npm package `^18.5.0` | Declared, **unused** |
| Env validation (`STRIPE_*`, Price IDs) | Present in `src/lib/env.ts` + `.env.example` |
| Plan catalog | Real: `src/server/billing/plan-catalog.ts` |
| Entitlement resolver / usage ledger API | Real enough for dashboard Free snapshots: `entitlements.ts` |
| DB tables (live) | All five billing/stripe tables **present** |
| Checkout / Portal / Webhook routes | **Placeholder dirs only** — no `route.ts` |
| Customer create / Stripe sync | **Stub** (`billing-customers.ts`) |
| Subscription status → entitlement mapping | **Stub** (`mapEntitlementState` always `"enabled"`) |
| Pricing page / billing UI | Missing pages; orphan i18n strings exist |
| Cron secret / cleanup HTTP | **Absent** |

## What is placeholder-only

1. `POST /api/billing/checkout`
2. `POST /api/billing/portal`
3. `POST /api/billing/webhook` (intended path; Prompt also mentions `/api/webhooks/stripe` — choose one and document)
4. `GET /api/billing/summary`
5. `/[locale]/pricing`
6. `/[locale]/dashboard/settings/billing` (+ success)
7. `getOrCreateBillingAccount` Stripe Customer creation
8. `mapEntitlementState`
9. Public pricing projection (`getPublicPricingView` / `pricing-view.ts` referenced in docs — **file missing**)
10. Cleanup scheduler health instrumentation
11. Several `package.json` browser verify scripts pointing at **missing** files

---

## Current billing schema (live + source)

Live tables (verified):

- `billing_accounts` — `userId` unique, `stripeCustomerId` unique nullable
- `billing_subscriptions` — Stripe sub/price/product, `planCode`, status, interval, period/cancel/trial, `lastStripeEventCreatedAt`
- `billing_entitlement_snapshots` — denormalized limits + feature flags per user
- `billing_usage_ledger` — category + `idempotencyKey` unique
- `stripe_events` — `stripeEventId` unique (**idempotency ledger**)

Schema defined in `src/db/schema.ts` (~1061+).  
Journal tag `0019_billing` exists; **`drizzle/0019_billing.sql` missing on disk** (gap from prior tree rewrite). Live DB already has tables — Prompt 12 needs **additive** migration only for new fields (e.g. cron last-run, public-tool entitlement columns, plan-code rename/mapping), not a full recreate.

## Current plan source

`src/server/billing/plan-catalog.ts` — codes: **`free` | `starter` | `professional` | `agency`**.

Paid Price env keys: `STRIPE_PRICE_STARTER_*`, `STRIPE_PRICE_PRO_*`, `STRIPE_PRICE_AGENCY_*`.

**Mismatch with Prompt 12 preference:** operator chose Guest + Free + **Pro** only. Catalog still exposes Starter/Pro/Agency (dashboard SaaS packaging). Consumer launch must not advertise Agency teams/API as sold features unless enforced and intended.

## Current entitlement source

`resolveEntitlement` / `ensureFreeEntitlementSnapshot` / `assertMonthlyAllowance` in `entitlements.ts`, consumed by processing, AI metadata, exports, CMS, API keys, workflows.

`mapEntitlementState` currently always returns **`enabled`** — unsafe for paid status enforcement until fixed.

Guest limits are **separate** (`guest-policy.ts`, `bulk-policy.ts`) and not driven by plan catalog.

## Current pricing-page claims

Pricing route directory empty. Marketing chrome still links to `/pricing`. No server projection rendered. Risk: broken nav or stale claims if any static copy exists elsewhere.

## Current backend-enforced limits

### Guest (public tools)

| Limit | Value |
| --- | --- |
| Ops / 24h | 5 |
| Max file | 10 MiB |
| Bulk files | 5 |
| Bulk batch | 25 MiB |
| ZIP | yes (guest bulk) |
| Retention | 1 hour |
| Bulk AI | **false** |
| AI | requires OpenAI; live generation **Blocked** (no key) |

### Signed-in elevated **public** bulk (still guest R2)

| Limit | Value |
| --- | --- |
| Bulk files | 20 |
| Batch | 80 MiB |

Not the same as dashboard Free plan. Does not raise guest 24h ops counter rules beyond guest policy.

### Dashboard Free plan (catalog)

| Limit | Approx |
| --- | --- |
| Projects | 5 |
| Images/project | high (dev default via quota policy) |
| Original storage | ~10 GiB (dev) |
| Monthly processing / AI / export | 200 / 50 / 20 |
| Bulk/AI/API/CMS flags | many **true** on Free (broad for SaaS) |

### Paid catalog (starter / professional / agency)

Higher dashboard caps; **not synced from Stripe** today.

## UI vs backend mismatches

| Issue | Detail |
| --- | --- |
| Upgrade CTAs → register/pricing | Pricing page missing; Checkout unwired |
| Free plan enables API/org/CMS/AI flags | Consumer pricing must not claim “unlimited” or sell API/teams in Prompt 12 |
| `bulkAi` | Dashboard `true`; guest bulk `false` — document; pricing must match |
| Signed-in public bulk elevation | Not reflected as a named “Free Account” commercial tier on a page |
| Status mapping stub | Would leave paid access wrong after cancel/fail if webhooks landed |
| Exact Size resize locked | Must not appear as Pro feature |

---

## Recommended commercial plans (final shape for Prompt 12)

Per operator: **Guest + Free Account + Pro**. **No Business plan.**

### Guest (no account)

- Single-image tools; 5 ops / 24h; 10 MiB; bulk ≤5 / 25 MiB; ZIP; 1h retention
- AI: unavailable/blocked when provider unconfigured (do not advertise live AI)
- No saved history / projects

### Free Account

- Saved projects + library under Free catalog
- Elevated public-bulk caps when signed in
- Monthly dashboard allowances from Free plan **only if backend enforces**
- No paid Checkout required
- AI: allowance may exist in catalog but **live generation Blocked** without key — UI must say unavailable

### Pro (single paid)

- Map to existing **`professional`** Price ID env keys **or** introduce `planCode: "pro"` aliased to professional limits
- Prefer: consumer-facing `pro`, keep DB mapping for `professional`, mark `starter`/`agency` **inactive** for new checkout
- Capabilities: higher storage/ops/AI; bulk compress/resize/convert; ZIP; saved history — **only what backend already enforces**
- Do **not** sell API/teams/WordPress as Pro differentiators in Prompt 12 consumer pricing

### Business

**Do not create** for launch.

## Pricing currency / approval

- Currency: **USD**
- Monthly/annual **amounts:** not approved — **do not invent**
- Env placeholders: keep Price ID slots empty until operator provides test `price_…`
- Classification target without IDs: **Ready for public free launch — paid launch Blocked**

## Required Stripe products/prices (when approved)

| Product | Interval | Env key |
| --- | --- | --- |
| Pro | month | `STRIPE_PRICE_PRO_MONTHLY` (exists) |
| Pro | year | `STRIPE_PRICE_PRO_ANNUAL` (exists) |

Deprecate Starter/Agency from **new** checkout; retain env keys for backward compatibility or hide from public catalog only.

## Required schema changes (additive)

Likely:

1. Optional: normalize `pro` plan code with legacy `professional` mapping
2. Cron: last-success timestamp store for health (table or singleton row)
3. Snapshot columns for public-tool limits if Free/Pro must differ on public bulk (or sync elevation policy from catalog projection)
4. Ensure webhook processed fields complete (mostly exist)

**No R2 ops during migration. Preserve users/projects.**

If `0019_billing.sql` remains missing, add **`0029_…` additive** migration only; do not re-apply full billing create if tables exist.

## Required webhook events

- `checkout.session.completed`
- `customer.subscription.created` / `updated` / `deleted`
- `invoice.paid` / `invoice.payment_failed`

Idempotency via `stripe_events`.

## Cleanup scheduler options

| Option | Fit |
| --- | --- |
| `POST /api/internal/cron/cleanup` + `CRON_SECRET` | **Recommended** — host-agnostic, GitHub Actions, external cron |
| System cron → `npm run worker:guest-cleanup` | Document as alternative |
| GitHub Actions schedule | Optional until production host chosen |
| In-process interval | Insufficient alone for retention guarantee |

Frequency: **every 10–15 minutes**. Overlap: advisory lock. Bounded batch (existing 25).

Health: record last OK run; scheduler probe must stop being unconditional skipped once instrumented.

## Playwright coverage gaps

| Coverage | Status |
| --- | --- |
| Guest tools EN/UR/mobile/keyboard | **Missing** (Prompt 11 API-heavy only) |
| Pricing / billing / upgrade gates | Missing |
| Dashboard library Playwright | Partial scripts exist |
| `playwright.config` / `e2e/` | Absent |
| Empty/missing scripts | `verify-guest-convert-browser.ts` empty; several package scripts missing files |

Prompt 12 must add a dedicated consumer launch Playwright script covering EN/UR/desktop/mobile/keyboard + pricing/billing smoke.

## Required environment variables

Existing:

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_STARTER_MONTHLY/ANNUAL=
STRIPE_PRICE_PRO_MONTHLY/ANNUAL=
STRIPE_PRICE_AGENCY_MONTHLY/ANNUAL=
STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID=
```

Add:

```text
CRON_SECRET=
NEXT_PUBLIC_APP_URL=   # if not already (success/cancel/return URLs)
```

All Stripe secrets server-only; app must **build and run** with billing disabled when unset.

## Migration requirements

1. Backup billing tables before alter
2. Additive SQL only
3. Verify authenticated data untouched
4. Do not store cards
5. Document recovery if Price mapping changes

## Files to create (planned)

- `docs/consumer-redesign-v2-prompt-12-inspection.md` (**this file**)
- `docs/consumer-redesign-v2-prompt-12-billing.md`
- `docs/consumer-redesign-v2-prompt-12-deployment.md`
- `docs/consumer-redesign-v2-prompt-12-completion.md`
- Billing routes: checkout, portal, webhook, summary
- Cron: `POST /api/internal/cron/cleanup` (+ auth)
- Pricing page + billing dashboard page + checkout success
- `pricing-view.ts` safe projection
- Stripe client + webhook processor + customer service (replace stubs)
- Playwright consumer launch script(s)
- Tests: plan catalog, entitlements status map, webhook idempotency, cron auth
- Optional additive `drizzle/0029_*.sql`

## Files to modify

- `plan-catalog.ts` — Guest/Free/Pro consumer model; inactive starter/agency for checkout
- `billing-policy.ts` — real status mapping
- `billing-customers.ts` — Stripe Customer + DB
- `entitlements.ts` — integrate status/grace; public-tool gates if needed
- Guest upgrade banners / bulk gates — honest reasons
- `health/probes.ts` — scheduler last-run + Stripe configured
- `.env.example`, `env.ts`
- PROJECT/ROADMAP/ARCHITECTURE/DECISIONS/CHANGELOG/TASKS/KNOWN_ISSUES/README

## Packages required

- `stripe` already present — wire it
- Playwright already present — add suite
- Avoid unnecessary new deps

## Production risks

1. Granting Pro from checkout success URL alone
2. Stub `mapEntitlementState` leaving paid features on after cancel
3. Advertising AI while OpenAI Blocked
4. Catalog Free enabling API/CMS looking like sold Free features
5. Missing cleanup cron → guest retention/privacy failure
6. Deleting `.next-pre-v2-cutover` before launch approval
7. Test vs live Stripe key mix-up
8. Journal/SQL drift (`0019` missing file)

## Rollback plan

1. Keep `.next-pre-v2-cutover` until approval
2. Env-disable Stripe (empty secrets → disabled UI)
3. DB: additive only; unused nullable columns if rolled back in code
4. Cron: disable schedule; CLI worker remains
5. Do not drop billing tables
6. Cancel test Stripe products in Dashboard if created

---

## Prompt 8 AI status

`OPENAI_API_KEY` unconfigured → live generation **Blocked**. Pricing and Pro AI allowance may exist as numbers but CTAs must say provider unavailable — never “Upgrade for AI” when blocker is missing key.

## Authenticated counts (preserve)

Expect users/projects/images to remain intact through any additive migration (last cutover: 13 / 8 / 9).

## Implementation gate

**Do not begin coding until this inspection is accepted.** Confirmed so far:

1. Collapse checkout to Free + Pro (Guest separate) — **yes**
2. USD; prices unapproved — **yes**
3. Target: free-launch ready / paid Blocked unless Price IDs supplied later

Please confirm before implementation:

- [ ] Use consumer plan code `pro` (alias `professional`) vs keep `professional` only
- [ ] Webhook path: `/api/billing/webhook` (existing empty dir) vs `/api/webhooks/stripe`
- [ ] Whether Free dashboard flags (API/CMS/orgs) should be **tightened** for pricing honesty (may affect existing Free users)

---

## Inspection checklist (prompt map)

| Topic | Finding |
| --- | --- |
| Prompts 1–11 docs | Cutover Passed; AI Blocked; scheduler skipped; Playwright pending |
| Pricing / upgrade components | Links exist; pages empty; guest → register |
| Plan/entitlement policy | Catalog + snapshots; status map stub |
| `bulkAi` | Dashboard true; guest bulk false |
| Guest / signed-in limits | Guest 5/10MiB; auth public bulk 20/80MiB |
| Billing schema | Live tables present |
| Stripe code | Package only; no SDK calls |
| Webhook/checkout/portal | Empty route dirs |
| Env validation | Present; all Stripe values missing live |
| Cleanup worker | `npm run worker:guest-cleanup` one-shot |
| Scheduler docs | HEALTH skipped; KNOWN_ISSUES |
| Deployment config | No Docker/Vercel file |
| Health endpoints | `/api/health*` restored in Prompt 11 |
| Playwright | Ad-hoc dashboard scripts; no consumer suite |
| Rollback / BUILD_ID | Confirmed above |
