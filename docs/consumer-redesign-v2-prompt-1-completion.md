# Consumer Redesign v2 — Prompt 1 completion

## Status
**Phase 1 closed and approved.** Shared guest foundation verified with tests, typecheck, lint, and a fresh production build to an alternate dist directory. Waiting for approval before Prompt 2 (Compress). Live `:3000` / `.next` left untouched.

## Final closure verification (2026-08-03)
| Check | Result |
|-------|--------|
| Guest unit tests | Pass (6/6) |
| `npm run typecheck` | Pass (0 errors) |
| `npm run lint` | Pass (0 errors; stub unused-arg warnings only) |
| Production build | Pass — `NEXT_DIST_DIR=.next-phase1-verify npm run build` |
| Live `.next` | Unchanged (timestamp preserved; not deleted/overwritten) |
| Cutover | Not performed |
| Prompt 2 | Not started |

## Foundation checklist
| Capability | Present |
|------------|---------|
| Guest session | Yes (`session-service`, `POST /api/guest/session`) |
| HttpOnly cookie | Yes (`seoimages_guest`, HttpOnly/Secure/SameSite=Lax) |
| HMAC token storage | Yes (hash only; raw never stored) |
| Guest isolation | Yes (session id + hashed token; no shared fake user) |
| Guest limits | Yes (10 MiB, 5 ops / 24h, MIME allow-list) |
| Private R2 abstraction | Yes (server keys `guest/{session}/…`; signed PUT/GET) |
| 1h immutable expiry | Yes (`createdAt + 1h`; downloads/uploads do not extend) |
| Shared cleanup | Yes (queue + `worker:guest-cleanup`) |
| EN/UR localization | Yes (`src/messages/guest/{en,ur}.json`) |
| Consumer public layout | Yes (marketing chrome + tool-first homepage) |

## Explicitly deferred
- Compress tool (Prompt 2+) and other tool pipelines
- Live DB apply of `0026` (incompatible prior guest tables on live DB)
- Replacing/deleting port-3000 `.next` cutover
- Prompt 9

## Stop
Awaiting approval to start **Consumer Redesign v2 Prompt 2 — Public Compress Image Tool**.
