# Known Issues

## Current blockers
- **`DATABASE_URL` is empty in `.env.local`.** Live database connection, migration apply, registration, login, and logout verification remain blocked.
- Google OAuth credentials are empty. Google sign-in stays disabled by design; OAuth flow is not tested.
- This workspace folder is not currently a Git repository (`git status` fails). `.gitignore` still lists `.env` / `.env.local`, which is correct once Git is initialized.

## Deferred auth / security features
- Distributed rate limiting / brute-force protection for login and registration
- Email verification delivery
- Password reset emails
- Magic-link authentication
- Team accounts / roles beyond a normal authenticated user

## Temporary product limitations
- Usage, billing, and settings nav items remain placeholders
- Create Project button remains disabled
- Dashboard stats remain static zeros
- No project CRUD, uploads, processing, storage, AI, or billing

## Environment notes
- npm may emit `Unknown env config "devdir"` from local npmrc (unrelated to app code)
- Ports `3000` / `3010` may be occupied; use a free local port for production-server checks
- A local `AUTH_SECRET` exists in gitignored `.env.local` for Auth.js
- DB CLI scripts now load `.env.local` safely; they still require a non-empty `DATABASE_URL`

## Resolved earlier
- Dashboard is no longer intentionally public; unauthenticated access redirects to localized login
- Auth-pending banner removed from the dashboard UI
- Auth schema migration generated (not yet applied)

## Technical debt
- Auth.js is on `next-auth@5.0.0-beta.32`
- ESLint still uses FlatCompat for `eslint-config-next@15.5.x`
- When upgrading to Next.js 16, rename `src/middleware.ts` → `src/proxy.ts`
