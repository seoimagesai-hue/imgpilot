# User account experience

Consumer accounts stay on the **same public tools** guests use. Signing in unlocks higher limits, billing, and usage history — not a separate B2B workspace as the primary home.

## Auth callbacks

| Path | Behavior |
| --- | --- |
| Safe `callbackUrl` | Relative `/{en\|ur}/…` only; open redirects rejected |
| Missing callback | Fallback **homepage** `/{locale}` |
| Legacy `/dashboard` callback | Rewritten to `/{locale}/account` |
| Already signed-in visiting login | Redirect to `/{locale}/account` |

## Header

- Logged out: Sign in + Create account
- Logged in: usage chip + avatar account panel (plan, usage bars, settings/billing/history, sign out)
- **No** Saved files, Admin, Developer, or Integrations in the consumer menu
- One-time post-login banner: limits active; re-select files (no guest→account transfer)

## Routes (`robots: noindex`, `force-dynamic`)

| Route | Purpose |
| --- | --- |
| `/account` | Overview |
| `/account/usage` | Limits table |
| `/account/billing` | Entitlement + Stripe CTAs (honest if unconfigured) |
| `/account/history` | `billing_usage_ledger` only |
| `/account/settings` | Profile display, language, delete **request** copy |

Public marketing chrome wraps all account pages.

## Legacy dashboard

- `/dashboard` **index** redirects to `/account`
- Nested `/dashboard/projects/*` remain for data retention but are **not** linked from consumer account UI

## Access context

`resolveUserAccessContext` in `src/server/account/access-context.ts` projects guest vs free/pro limits for UI. Enforcement remains server-side.
