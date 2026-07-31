# SEO Images

Multilingual bulk website image optimization SaaS.

## Setup

```bash
cp .env.example .env.local
# Edit .env.local locally (do not paste secrets into chat):
# - DATABASE_URL=postgresql://...   # development DB; include sslmode=require for Neon/Supabase
# - AUTH_SECRET=...                 # openssl rand -base64 32
npm install
npm run db:check
npm run db:migrate
npm run build
npm run start
```

Open:
- http://localhost:3000/en/login
- http://localhost:3000/ur/login
- http://localhost:3000/en/dashboard (requires sign-in)

## Database verification

1. Confirm `.env.local` has a non-empty development `DATABASE_URL` (never commit this file).
2. Run `npm run db:check` — must print `Database connection: ok`.
3. Run `npm run db:migrate` to apply auth tables.
4. Register/login through the UI, then confirm dashboard access and logout.

Live auth verification remains blocked until `DATABASE_URL` is set.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development (Turbopack) |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Drizzle SQL migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:check` | Connectivity check |

## Notes

- Google sign-in appears only when both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set.
- Do not commit real secrets. Use `.env.local` locally (gitignored).
- See `PROJECT.md`, `ARCHITECTURE.md`, and `TASKS.md` for product and engineering source of truth.
