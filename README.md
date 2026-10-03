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

## Realtime Feed (SSE)

The dashboard feed subscribes to `GET /api/social/stream`, a server-sent
events endpoint that emits one deterministic mock social post immediately on
connect and then every **15 s** (`?interval=` clamped 50–60 000 ms exists for
tests), with `: ping` heartbeats to keep the connection warm. Arrivals queue
up behind an **"N new posts"** pill — a polite `aria-live` region above the
grid; clicking it reveals the posts at the top of the feed (deduped by id)
and the pill animates out unless you prefer reduced motion.

Implementation: `app/api/social/stream/route.ts` → `hooks/useSocialStream.ts`
→ `features/feed/realtimeSlice.ts` (`pending` → `live`, ephemeral — never
persisted) merged into the social stream by `FeedSection`.

## User Flow

1. **Sign in** — unauthenticated visits bounce to `/login?callbackUrl=…`; the
   seeded demo account is in [Authentication](#authentication). First login
   shows a one-time **onboarding dialog** (Escape or the button dismisses it
   and is remembered).
2. **Feed** (`/`) — a unified, interleaved grid of news, movies, and social
   posts for your chosen topics. Live SSE posts queue behind the
   **"N new posts"** pill; click it to promote them to the top. Cards can be
   reordered by keyboard or pointer (Space → arrows → Space) and hearted.
3. **Trending** — the same sources scored and ranked, switchable by category
   tabs.
4. **Favorites** (`/favorites`) — everything you hearted, grouped by type
   behind filter chips; removing a card raises an **undo toast**, and it all
   persists per account.
5. **Settings** (`/settings`) — pick up to 5 feed topics (the feed refetches
   immediately), switch dark mode, or change the interface language
   (English / हिन्दी).
6. **Search** — the header bar debounces (400 ms) into `/search?q=…`, grouped
   by source with filter chips; two characters minimum.
7. **Profile** (`/profile`) — display name and avatar, reflected in the
   account menu. **Sign out** returns you to `/login` and re-protects the
   dashboard.

Preferences, favorites, layout order, language, and theme all persist to
`localStorage` under a per-account key and survive reloads.

## Architecture

```
route handlers (/app/api/*)   ← the only place external APIs are called
        │  RTK Query (features/*/api or shared baseApi)
        ▼
Redux store (/store)          ← slices: preferences, favorites, layout,
        │                          feed (realtime), auth, ui
        │  selectors + listener middleware (debounced persistence)
        ▼
components (/components)      ← presentational; features/ containers wire
                                store + RTK Query + i18n
```

- **State**: `Redux Toolkit` owns all client state. RTK Query handles
  fetching/caching for news, movies, and social; every response is validated
  and merged into the `ContentItem` discriminated union (`/types`).
- **Persistence**: `store/persistence.ts` writes a whitelist of slices
  (preferences, favorites, layout) to `localStorage`, debounced at 250 ms and
  scoped per user (`pcd:state:v1:<id>`); rehydration happens after mount so SSR
  markup and the first client render match.
- **Data flow**: pages are server components for metadata/layout; client
  containers (`features/*`) subscribe to the store, fire RTK Query, and render
  `components/*` with loading (skeleton), empty, and error states.
- **Security**: no API keys reach the browser — every third-party call goes
  through the route handlers, which fall back to `/mocks` when a key is absent;
  `AUTH_SECRET` lives in `.env.local` only.

## Demo Video Script

A ~60 s walkthrough (record at 1280×720):

1. **0:00–0:05** Title: sign-in screen with the demo credentials typed in.
2. **0:05–0:15** Feed loads (skeleton → grid); dismiss onboarding; scroll.
3. **0:15–0:25** New-posts pill appears — click it, live posts land on top.
4. **0:25–0:35** Keyboard reorder: focus a card handle, Space, arrows, Space;
   Reset order.
5. **0:35–0:45** Heart a card → Favorites page → filter chips → remove →
   Undo toast → reload to show persistence.
6. **0:45–0:55** Settings: toggle a topic (feed refetches), dark mode, switch
   to हिन्दी.
7. **0:55–1:00** Search "telescope" → grouped results; closing title.

## Project Structure

See rule 3 in [`CLAUDE.md`](./CLAUDE.md): `/app`, `/components/{ui,cards,layout,feed}`,
`/features/{preferences,favorites,feed,search}`, `/store`, `/lib`, `/hooks`,
`/types`, `/mocks`, `/tests`, `/e2e`.

## Status

Milestone tracking lives in [`PLAN.md`](./PLAN.md). Core **M1–M10** ✅ plus
bonuses **M11 — mock auth** ✅, **M12 — realtime SSE feed** ✅, and
**M13 — i18n (en + hi)** ✅. E2E coverage: 14 Playwright tests (auth, search,
theme, preferences, favorites, drag-and-drop, axe-core a11y scans).
