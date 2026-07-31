# Decisions

## 2026-07-31: Next.js App Router + TypeScript foundation
**Decision:** Use Next.js 15 App Router with strict TypeScript for the SaaS foundation.  
**Date:** 2026-07-31  
**Reason:** Matches the approved technology direction and supports RSC, locale segments, and middleware for i18n.  
**Alternatives considered:** Pages Router; Remix; separate Vite SPA + API.  
**Consequences:** Routes live under `src/app`; server/client component boundaries must be respected.

## 2026-07-31: next-intl with locale-prefixed routing
**Decision:** Use `next-intl` with always-on `/en` and `/ur` prefixes.  
**Date:** 2026-07-31  
**Reason:** Explicit URLs are predictable, shareable, and easier to QA for LTR/RTL.  
**Alternatives considered:** Cookie-only locale; `next-i18next`; custom dictionary loader.  
**Consequences:** Every user-facing route is locale-prefixed; middleware negotiates locale.

## 2026-07-31: RTL at the document level
**Decision:** Set `dir` and `lang` on `<html>` from the active locale in the locale layout.  
**Date:** 2026-07-31  
**Reason:** Native directionality fixes text, form controls, and logical CSS mirroring.  
**Alternatives considered:** Per-component RTL class toggles only.  
**Consequences:** New UI should prefer logical properties (`border-e`, `ms`/`me`, etc.).

## 2026-07-31: Defer real authentication
**Decision:** Do not ship fake auth or hardcoded credentials; mark dashboard protection as pending.  
**Date:** 2026-07-31  
**Reason:** Auth requires DB + Auth.js provider choices and real session tests.  
**Alternatives considered:** Mock session cookie; hardcoded admin password. Rejected as unsafe and misleading.  
**Consequences:** Dashboard is reachable without login until the auth task; UI states this clearly.

## 2026-07-31: Zod environment validation split
**Decision:** Validate env with Zod; separate server-only getters from client-safe `NEXT_PUBLIC_*` parsing.  
**Date:** 2026-07-31  
**Reason:** Fail clearly on bad public config; avoid accidental secret exposure patterns.  
**Alternatives considered:** `@t3-oss/env-nextjs`; untyped `process.env` usage.  
**Consequences:** Future required secrets become `.min()` / required when those features ship; today most service vars are optional empties.

## 2026-07-31: Vitest as the test runner
**Decision:** Use Vitest for the unit/foundation test suite.  
**Date:** 2026-07-31  
**Reason:** Fast, TypeScript-friendly, works without a full Playwright install for Milestone 0.  
**Alternatives considered:** Jest; Playwright-only.  
**Consequences:** Component/E2E browser tests remain a later addition if needed.

## 2026-07-31: Keep Next.js 15 middleware filename
**Decision:** Use `src/middleware.ts` (not `proxy.ts`) while the app is on Next.js 15.5.  
**Date:** 2026-07-31  
**Reason:** `proxy.ts` is the Next.js 16 convention; 15.5 expects `middleware.ts` for the request interceptor to run.  
**Alternatives considered:** Keeping an unused `proxy.ts` file.  
**Consequences:** When upgrading to Next.js 16, rename to `proxy.ts` per Next.js codemod / next-intl guidance.

## 2026-07-31: Defer Drizzle/R2/Sharp/Stripe package installs
**Decision:** Document PostgreSQL/Drizzle/R2/workers/AI/Stripe as planned; do not install those packages in Milestone 0.  
**Date:** 2026-07-31  
**Reason:** Avoid unused dependencies and false “implemented” claims.  
**Alternatives considered:** Installing full stack scaffolding unused.  
**Consequences:** `package.json` stays lean; architecture docs mark systems as planned.

## 2026-07-31: Patch Next.js 15.5 and React 19 for published CVEs
**Decision:** Upgrade to `next@15.5.22`, `eslint-config-next@15.5.22`, `react@19.1.2`, and `react-dom@19.1.2` while staying on the 15.5 line.  
**Date:** 2026-07-31  
**Reason:** `15.5.0` / early 15.5 patches were flagged for critical RSC vulnerabilities; remaining on 15.5 avoids a forced Next 16 `proxy.ts` migration in this task.  
**Alternatives considered:** Jumping to Next.js 16 immediately; leaving vulnerable 15.5.0.  
**Consequences:** App remains on middleware convention; security posture improved for foundation.

## 2026-07-31: ESLint FlatCompat for Next 15.5
**Decision:** Use `@eslint/eslintrc` FlatCompat with `next/core-web-vitals` and `next/typescript`.  
**Date:** 2026-07-31  
**Reason:** `eslint-config-next@15.5.x` still exports legacy `extends` objects, which are not directly iterable in native flat config.  
**Alternatives considered:** Hand-rolled plugin config; upgrading only ESLint packages to Next 16 style.  
**Consequences:** Lint works on ESLint 9; may simplify after a future Next major upgrade.

## 2026-07-31: Auth.js v5 beta for App Router
**Decision:** Use `next-auth@5.0.0-beta.32` with `@auth/drizzle-adapter`.  
**Date:** 2026-07-31  
**Reason:** Compatible with Next.js 15 App Router; official Auth.js line for App Router on npm is currently the v5 beta tag.  
**Alternatives considered:** next-auth v4; Clerk/Lucia.  
**Consequences:** Follow Auth.js v5 APIs (`handlers`, `auth`, `signIn`, `AUTH_*` env names).

## 2026-07-31: JWT session strategy
**Decision:** Use JWT sessions while persisting users/accounts with Drizzle.  
**Date:** 2026-07-31  
**Reason:** Auth.js Credentials provider requires JWT sessions.  
**Alternatives considered:** Database sessions only (incompatible with Credentials without custom session creation).  
**Consequences:** Session integrity depends on `AUTH_SECRET`; adapter still stores users/accounts for OAuth/registration.

## 2026-07-31: bcryptjs password hashing
**Decision:** Hash passwords with `bcryptjs` (cost factor 12).  
**Date:** 2026-07-31  
**Reason:** Maintained, pure-JS bcrypt suitable for Node without native build friction on Windows.  
**Alternatives considered:** `bcrypt` native; Argon2.  
**Consequences:** No plaintext passwords stored; hashes never exposed to clients.

## 2026-07-31: Dashboard protection in server layout
**Decision:** Protect `/[locale]/dashboard` in the dashboard layout via `auth()`, keep middleware for next-intl only.  
**Date:** 2026-07-31  
**Reason:** Avoid Edge runtime / DB access issues in middleware while preserving locale routing.  
**Alternatives considered:** Combined auth+intl middleware.  
**Consequences:** Authorization is server-enforced; client hiding is not relied upon.

## 2026-07-31: Conditional Google provider
**Decision:** Register Google provider only when both Google env vars are set; otherwise show disabled UI.  
**Date:** 2026-07-31  
**Reason:** Prevents a non-functional Google button and fails env validation if only one Google var is present.  
**Alternatives considered:** Always show Google and error at runtime.  
**Consequences:** Local/dev can ship credentials auth without Google setup.

## 2026-07-31: Drizzle migrations (generate, do not push)
**Decision:** Use Drizzle Kit SQL migrations; never silent production `push`/destructive sync.  
**Date:** 2026-07-31  
**Reason:** Reviewable schema history and safer apply step.  
**Alternatives considered:** `drizzle-kit push` as primary workflow.  
**Consequences:** Developers run `db:generate` then `db:migrate` against a real `DATABASE_URL`.

## 2026-07-31: Load `.env.local` for Drizzle CLI scripts
**Decision:** Load `.env.local` (then `.env`) in Drizzle/db CLI helpers without logging values.  
**Date:** 2026-07-31  
**Reason:** Next.js reads `.env.local`, but drizzle-kit/`tsx` scripts do not unless explicitly loaded — empty process env caused false “missing DATABASE_URL” confusion.  
**Alternatives considered:** Require exporting DATABASE_URL in the shell; duplicate values into `.env`.  
**Consequences:** `npm run db:check` / `db:migrate` see the same local secrets file as the app, still without printing them.
