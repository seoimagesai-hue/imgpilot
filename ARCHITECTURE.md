# Architecture

Status legend: **Implemented** | **Planned (not implemented)**

## Frontend — Implemented
- Next.js App Router under `src/app`
- React Server Components by default; Client Components only for interactivity
- Tailwind CSS v4
- shadcn/ui-compatible layout helpers
- Locale-prefixed dashboard shell with desktop sidebar and mobile navigation
- Localized login and registration forms

## Server routes — Implemented (auth) / Planned (product)
- **Implemented:** `/api/auth/[...nextauth]`, localized `/login` and `/register`, protected `/dashboard`
- **Planned:** projects, uploads, processing, billing webhooks

## Database — Implemented (auth foundation)
- PostgreSQL via `postgres`.js + Drizzle ORM
- Singleton client in `src/db/index.ts` (hot-reload safe)
- Auth-only schema in `src/db/schema.ts`: `users`, `accounts`, `sessions`, `verification_tokens`, `authenticators`
- `users.password_hash` for credentials accounts
- Drizzle Kit config (`drizzle.config.ts`) and SQL migrations under `drizzle/`
- Scripts: `db:generate`, `db:migrate`, `db:studio`, `db:check`
- Product tables (projects, images, billing, etc.) are **not** created

## Authentication — Implemented
- Auth.js (`next-auth@5.0.0-beta.32`) with App Router handlers
- Credentials provider (email/password)
- Google provider loaded only when both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set
- Registration via server action with Zod validation + bcrypt hashing
- Login/logout via Auth.js; generic invalid-credentials messaging
- Safe internal callback URLs only (open-redirect prevention)

### Session strategy — JWT
JWT sessions are used because Auth.js Credentials provider requires JWT. Users/accounts still persist through the Drizzle adapter for OAuth and registration records. Database `sessions` table remains for adapter compatibility / future use.

### Route protection
- Enforced in the localized dashboard layout with `auth()` + `requireUser()` (server-side)
- Middleware remains next-intl-only to avoid Edge/database incompatibilities
- Unauthenticated `/en/dashboard` → `/en/login?callbackUrl=...`
- Unauthenticated `/ur/dashboard` → `/ur/login?callbackUrl=...`
- Authenticated visitors are redirected away from login/register

### Deferred auth features
- Email verification delivery
- Password reset emails
- Magic links
- Distributed rate limiting / brute-force controls (architecture note only)

## Internationalization — Implemented
- next-intl with `/en` and `/ur`
- Auth copy lives in the `authentication` namespace (EN + UR)
- Interface language remains separate from future metadata output language

## RTL handling — Implemented
- Locale layout sets `<html lang dir>`
- English LTR; Urdu RTL
- Auth forms use logical layout-friendly utilities

## Security boundaries
- Server-only secrets via Zod (`DATABASE_URL`, `AUTH_SECRET`, Google secrets)
- Password hashes never returned to clients or sessions
- Google credentials must be paired (both set or both empty)
- Auth event logs omit passwords, hashes, tokens, and secrets
- SQL injection mitigated by Drizzle parameterized queries
- Rate limiting is deferred and tracked in `KNOWN_ISSUES.md`

## Future systems — Planned
- Cloudflare R2, Sharp workers, job queue, AI providers, Stripe billing

## Folder structure
```
src/
  app/                 # locale routes, dashboard, api/auth
  components/auth/     # login/register/google UI
  components/dashboard/
  db/                  # Drizzle client, schema, health
  server/auth/         # actions, password, validation, session helpers
  auth.ts              # Auth.js config
  i18n/
  messages/
  lib/env.ts
drizzle/               # SQL migrations
```
