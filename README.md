# Prism — Personalized Content Dashboard

A "Personalized Content Dashboard" built for the SDE Intern Frontend Development
Assignment: a unified, customizable feed of news, movie recommendations, and
social posts with search, favorites, drag-and-drop reordering, and dark mode.

See [`PLAN.md`](./PLAN.md) for the architecture and milestone plan and
[`CLAUDE.md`](./CLAUDE.md) / [`AGENTS.md`](./AGENTS.md) for project rules.

## Tech Stack

- **Next.js** (App Router) + **TypeScript** (strict)
- **Tailwind CSS** v4 + CSS custom properties (dark mode)
- **Redux Toolkit** + **RTK Query** (state + data fetching)
- **Framer Motion** (animation), **@dnd-kit** (drag & drop)
- **Vitest** + React Testing Library + **MSW** (unit/integration)
- **Playwright** (E2E)

## Getting Started

```bash
npm install
cp .env.example .env.local   # then set AUTH_SECRET (required) — see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in (see
[Authentication](#authentication)).

## Scripts

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the dev server                  |
| `npm run build`     | Production build                      |
| `npm start`         | Serve the production build            |
| `npm run lint`      | ESLint                                |
| `npm run typecheck` | TypeScript, no emit                   |
| `npm test`          | Unit + integration tests (Vitest)     |
| `npm run test:coverage` | Unit/integration tests + coverage |
| `npm run e2e`       | Playwright E2E tests                  |
| `npm run format`    | Prettier write                        |

## Environment Variables

All third-party API calls happen server-side in `/app/api/*` route handlers; keys
never reach the browser. Copy `.env.example` to `.env.local` and fill in:

| Variable        | Required | Purpose                                        |
| --------------- | -------- | ---------------------------------------------- |
| `AUTH_SECRET`   | **yes**  | Signs NextAuth session cookies. Generate with `openssl rand -base64 32` |
| `NEWS_API_KEY`  | no       | Live news; falls back to mock data without it  |
| `TMDB_API_KEY`  | no       | Live movies; falls back to mock data without it |
| `TMDB_READ_ACCESS_TOKEN` | no | Same, alternate TMDB auth               |

## Authentication

Demo sign-in guards every dashboard route (`proxy.ts` redirects signed-out
visitors to `/login?callbackUrl=…`):

- **Email:** `demo@prism.app`
- **Password:** `PrismDemo!2026`

Or create an account from the sign-up page. Passwords are stored only as
scrypt salt:hash pairs (Node `crypto`) — there is no plaintext anywhere in the
app; the demo hash is baked into `lib/auth/users.ts`. Favorites, topics, and
layout persist per account (`pcd:state:v1:<userId>` in localStorage); sign-out
returns you to `/login`.

## Language (i18n)

The interface ships in **English** and **Hindi** (`react-i18next` + typed JSON
resources under `lib/locales/{en,hi}/` — 11 namespaces: `common`, `nav`,
`pages`, `feed`, `settings`, `onboarding`, `cards`, `favorites`, `search`,
`trending`, `auth`). Switch via the header select or **Settings → Interface
language**; the choice applies immediately (`LanguageSync`), updates
`<html lang>`, and persists with your preferences across reloads.

Conventions:

- Client components call `useTranslation('<ns>')` imported from `@/lib/i18n`
  (never `react-i18next` directly), so the i18next instance is always
  initialized first. Unqualified keys fall back to the `common` namespace.
- Server pages render copy through client islands: `<T ns="pages"
  k="feed.title" />` (`lib/i18n/T.tsx`).
- `en` and `hi` key trees are enforced equal (placeholders too) by
  `tests/unit/i18nResources.test.ts`; `hi` is typed `typeof en`.

Known gaps (documented intentionally): `<head>` `metadata.title` and
server-rendered landmark names (e.g. the profile section's `aria-label`) stay
English; API-passthrough error messages from route handlers stay English;
external data labels (TMDB genre names, news source names) are not translated.

## Project Structure

See rule 3 in [`CLAUDE.md`](./CLAUDE.md): `/app`, `/components/{ui,cards,layout,feed}`,
`/features/{preferences,favorites,feed,search}`, `/store`, `/lib`, `/hooks`,
`/types`, `/mocks`, `/tests`, `/e2e`.

## Status

Milestone tracking lives in [`PLAN.md`](./PLAN.md). Current: **M8 — drag & drop**
✅ plus bonus **M11 — mock auth** ✅ and **M13 — i18n (en + hi)** ✅.
