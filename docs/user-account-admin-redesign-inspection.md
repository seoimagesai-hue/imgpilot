# User Account + Admin Redesign — Inspection

Date: 2026-08-04

## Current auth landings

- `getSafeCallbackUrl` fallback: `/[locale]/dashboard`
- `redirectIfAuthenticated`: forces `/dashboard`
- Login/register accept safe relative callbacks (tool return possible when provided)
- Suspended users redirected to login with `error=suspended`

## Public header

- [`public-chrome.tsx`](../src/components/marketing/public-chrome.tsx): always Sign in / Create account
- No session awareness, no usage chip, no account menu

## Entitlements

- Guest: `guest-policy` (file size, ops/day, 1h TTL); guest bulk AI off
- Signed-in: `resolveEntitlement` + plan catalog (`free` / `pro` consumer)
- Usage: `billing_usage_ledger` via `countUsageInPeriod`
- Pricing view claims saved history for free/pro; **no consumer file library** outside projects

## Dashboard

- Full B2B surface: projects, library, integrations, developer, automation
- `/dashboard/analytics` missing (404)
- Settings → billing works under dashboard chrome

## Admin

- `users.role`: `user | super_admin`
- `requireSuperAdmin` exists (non-admin → `notFound`)
- `admin_audit_logs` / `admin_support_notes` schema present
- **No admin pages/APIs implemented** (empty shells only)

## Decisions for this redesign

1. Normal users stay on public tools after login.
2. Default callback → homepage `/`; already-authed login page → `/account`.
3. `/dashboard` index → redirect `/account`; nested project routes unlinked but retained.
4. Account menu omits Saved files (unsupported).
5. History = usage ledger entries only (honest empty state).
6. Admin at `/[locale]/admin/*`, separate ops UI, no consumer tools.
7. Plans/limits admin v1 = read-only catalog view.
8. No guest→account file transfer; re-upload after login.
