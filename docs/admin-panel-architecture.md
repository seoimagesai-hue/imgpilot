# Admin panel architecture

Locale-prefixed ops UI at `/{en|ur}/admin/*`. Separate from marketing tools and consumer `/account`.

## Access

- `requireSuperAdmin` — signed-out → login; non-admin → `notFound()` (no existence leak); suspended → login
- Layout: `dynamic = 'force-dynamic'`, `robots: noindex`
- Bootstrap: set `users.role = 'super_admin'` for the intended email (SQL/CLI). No hardcoded admin emails in migrations.

```sql
UPDATE users SET role = 'super_admin', updated_at = now()
WHERE email = 'ops@example.com';
```

## Surface

Dark navy sidebar (`#0f172a`), white content. Nav: Overview, Users, Plans, Limits, Billing, Subscriptions, Payments, Stripe status, Usage, Jobs, Guest sessions, Cleanup, System, Audit logs, Settings.

No public tool links.

## Data & safety

| Area | Source | Notes |
| --- | --- | --- |
| Overview | DB aggregates | Revenue unavailable unless Stripe configured + computable |
| Users | `users` | Suspend/restore via `accountStatus` + audit |
| Plans / Limits | `plan-catalog` + guest policy | **Read-only** in v1 |
| Billing / Stripe | Local tables + config booleans | **No secrets** in UI |
| Guests | `guest_sessions` | Scrubbed (no tokens/IPs/keys/URLs) |
| Cleanup | scheduler heartbeat + authenticated job | Confirmation + audit |
| Audit | `admin_audit_logs` | Append-only |

Modules: `src/server/admin/{audit,queries,actions,redaction,constants}.ts`.

## Out of scope

- In-browser Stripe secret editing
- Live plan/Price editor
- User impersonation
- Guest asset claim into permanent library
