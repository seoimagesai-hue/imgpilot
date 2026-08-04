# Consumer Redesign v2 — Prompt 12 deployment & operations

## Live cutover state (this environment)

| Item | Value |
| --- | --- |
| Production dist | `.next` |
| Current BUILD_ID | `B9c4mpgTjBua5sEpoOSoY` |
| Rollback dist | `.next-pre-v2-cutover` |
| Rollback BUILD_ID | `6RV1arlMI2rIKw68Qghu-` |
| Bind | `127.0.0.1:3000` |
| Guest cleanup worker | `npx tsx scripts/guest-cleanup-worker.ts` |

Do **not** delete `.next-pre-v2-cutover` until launch verification is approved.

---

## Start / restart (Windows)

```powershell
Remove-Item Env:NEXT_DIST_DIR -ErrorAction SilentlyContinue
$env:NODE_ENV = "production"
npx next start -p 3000 -H 127.0.0.1
# separate terminal:
npx tsx scripts/guest-cleanup-worker.ts
```

Rebuild:

```powershell
Remove-Item Env:NEXT_DIST_DIR -ErrorAction SilentlyContinue
npm run build
```

Rollback (preserve current `.next` first):

```powershell
# stop listeners on 3000 first
Rename-Item .next .next-failed-p12
Rename-Item .next-pre-v2-cutover .next
npx next start -p 3000 -H 127.0.0.1
```

---

## Cleanup scheduler

| Item | Detail |
| --- | --- |
| Endpoint | `POST /api/internal/cron/cleanup` |
| Auth | Header `x-cron-secret` or `Authorization: Bearer …` |
| Secret | `CRON_SECRET` or `CLEANUP_CRON_SECRET` |
| Method GET | `405` |
| Missing secret config | `503 CRON_NOT_CONFIGURED` |
| Bad secret | `401` |
| Overlap | In-process guard → `202` overlap |
| Heartbeat | `.data/ops/cleanup-scheduler.json` (aggregate counts only) |
| Health | `GET /api/health/scheduler` |

Recommended external schedule: every **10–15 minutes** (≤ 1h guest retention).

Example (system / GitHub Actions / platform cron):

```bash
curl -X POST "https://YOUR_HOST/api/internal/cron/cleanup" \
  -H "x-cron-secret: $CRON_SECRET"
```

Verified locally (side server `:3002` with temporary secret): unauthorized/wrong secret `401`; authorized run `200` with aggregate counts; scheduler probe `ok` / `heartbeat_fresh`.

Production `:3000` had empty `CRON_SECRET` at cutover → endpoint returns `503` until env is set and process restarted. Do not rely only on the in-process guest worker for retention guarantees.

---

## Stripe (test mode)

1. Create Products/Prices in Stripe Dashboard (test mode).
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY` (and/or annual).
3. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```
4. Checkout from `/pricing` or billing page → complete with test card.
5. Confirm local subscription + billing page after webhook (not after redirect alone).
6. Open Customer Portal from Manage subscription.
7. Cancel at period end → status flag updates via webhook.
8. Clean test customers/subs in Stripe Dashboard when done.

Until Price IDs are approved and populated: **paid launch remains Blocked**; free tools stay available.

---

## Health probes

| Path | Purpose |
| --- | --- |
| `/api/health/ready` | App readiness |
| `/api/health/database` | DB |
| `/api/health/storage` | R2 |
| `/api/health/worker` | Processing heartbeat |
| `/api/health/scheduler` | Cleanup scheduler heartbeat |
| `/api/health` | Aggregated |

Billing config appears in internal probes (configured boolean only — no secrets or event IDs publicly).

---

## Environment checklist

Required for free public launch (already typical):

- `DATABASE_URL`, `AUTH_SECRET`, R2 credentials, `GUEST_*`

Required for paid beta:

- Stripe secret + webhook secret + Pro Price ID(s)
- `NEXT_PUBLIC_APP_URL` matching public origin
- Webhook endpoint reachable from Stripe

Required for cron retention guarantee:

- `CRON_SECRET` on app process
- External scheduler hitting cleanup every 10–15 minutes

Optional / Blocked separately:

- `OPENAI_API_KEY` for live AI Alt Text

---

## Monitoring

- Ready endpoint + scheduler stale (`degraded` when heartbeat older than ~20 minutes)
- Aggregate cleanup counts in heartbeat file
- Stripe Dashboard for payment failures (app applies least privilege)

No full webhook payloads or secrets in logs/analytics.

---

## Legal / support readiness

Professional legal review of Privacy/Terms/Cookies remains outstanding (see `KNOWN_ISSUES.md`). Support process for billing disputes should use Stripe + authenticated billing owner email before paid production launch.
