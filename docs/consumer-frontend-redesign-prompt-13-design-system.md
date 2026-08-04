# Consumer Frontend Redesign — Prompt 13 design system

**Status:** Phase A  
**Accent choice:** Cobalt blue primary (`#1d4ed8`) — clear CTAs without purple-on-white cliché or legacy teal-only utility look.  
**Surfaces:** Cool light gray background, white cards, soft borders.

## Tokens (`globals.css`)

| Token | Role |
| --- | --- |
| `--background` | Page `#f5f7fb` |
| `--foreground` | Text `#0f172a` |
| `--card` | Surfaces `#ffffff` |
| `--border` | `#e2e8f0` |
| `--muted-foreground` | `#64748b` |
| `--accent` | Primary action `#1d4ed8` |
| `--accent-soft` | Soft chip/bg `#eff6ff` |
| `--accent-foreground` | On-accent `#ffffff` |
| `--danger` | Errors `#b91c1c` |
| `--radius-card` | `1rem` |
| `--radius-control` | `0.75rem` |
| `--shadow-soft` | Soft elevation |

## Typography

- Font stack: `"Segoe UI", "Noto Nastaliq Urdu", "Noto Sans Arabic", Tahoma, sans-serif` (Urdu-capable; expressive redesign later can add a display face without blocking Phase A)
- H1: ≤2 lines, ~2rem–2.5rem
- Body: 1rem / 1.55
- Buttons: ≥0.9375rem, min-height 2.75rem

## Containers

| Use | Max width |
| --- | --- |
| Marketing sections | `76rem` (≈1216px) |
| Tool workspace | `82rem` (≈1312px) |
| Reading / FAQ | `52rem` (≈832px) |

## Spacing

Section vertical rhythm: `py-10`–`py-14`. Card padding: `p-5`–`p-8`. Compact breadcrumbs: `text-sm` + tight `mb-3`.

## Components

Buttons: filled accent primary; ghost/outline secondary. Cards: white, `border`, soft radius, light shadow optional on hover only for interactive cards.
