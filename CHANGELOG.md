# Changelog

## 2026-07-31 — Live DB verification attempted (blocked)

- Re-inspected auth migration: auth-only CREATE TABLE / FK statements; no destructive DROP/TRUNCATE.
- Improved DB CLI env loading from `.env.local` without logging secret values.
- Enabled TLS for Neon/Supabase-style connection URLs in the Postgres client.
- `npm run db:check` confirms `DATABASE_URL` is still empty — connection, migrate, and live auth verification remain blocked.

## 2026-07-31 — Auth + database foundation

- Added PostgreSQL/Drizzle auth schema (`users`, `accounts`, `sessions`, `verification_tokens`, `authenticators`) with `password_hash`.
- Generated initial migration `drizzle/0000_slim_mariko_yashida.sql` (not applied; no `DATABASE_URL`).
- Implemented Auth.js (`next-auth@5.0.0-beta.32`) with credentials login/registration, logout, and JWT sessions.
- Added conditional Google provider (enabled only when both Google env vars are set).
- Added localized `/[locale]/login` and `/[locale]/register` pages (EN/UR, LTR/RTL).
- Protected dashboard via server layout session checks; removed auth-pending banner; added signed-in user menu.
- Expanded Zod env validation (paired Google credentials, `AUTH_TRUST_HOST`, auth secret guidance).
- Added auth validation/password unit tests (17 total tests passing).
- Documented architecture, decisions, known blockers, and deferred rate limiting / email verification / password reset.

## 2026-07-31 — Milestone 0 foundation (validated)

- Inspected and completed the Next.js App Router foundation for SEO Images.
- Added/expanded source-of-truth docs.
- Configured English and Urdu locale routing, translations, language switching, and RTL direction.
- Added responsive dashboard shell and typed environment validation.
- Added lint, typecheck, test, and build scripts; upgraded Next.js/React for security patches.
