# PLAN.md — Personalized Content Dashboard

> Living plan. Update as milestones complete. Source of truth for requirements:
> `SDE Intern Frontend Development Assignment.md`. Rules: `CLAUDE.md` / `AGENTS.md`.
> Repo is greenfield — everything starts at M1.
>
> **Status (2026-10-02):** M1 ✅ · M2 ✅ (types, store, slices, persistence) ·
> M3 ✅ (route handlers, normalizers, RTK Query, unit tests) ·
> M4 ✅ (app shell, dark mode, transitions, a11y) · M5–M13 pending.

---

## 1. Architecture Overview

Next.js App Router, all third-party API traffic server-side. The browser never sees
an API key.

```
┌──────────────────────────── Browser ────────────────────────────┐
│  UI (components/*)                                              │
│    │  useGetNewsQuery / useGetMoviesQuery / useGetSocialQuery   │
│    ▼                                                            │
│  RTK Query (contentApi) ── server-state cache, dedupe, retry    │
│    │                                                            │
│  Redux store                                                    │
│    ├─ slices (client state): preferences, favorites,            │
│    │  feedOrder, theme, search                                  │
│    └─ persistenceMiddleware → localStorage (whitelisted slices) │
└────────────────────────────┬────────────────────────────────────┘
                             │ fetch (same-origin /api)
┌────────────────────────────▼───── Next.js server ───────────────┐
│  Route handlers  /app/api/news|movies|social/route.ts           │
│    ├─ validate + normalize params (lib/validate.ts)             │
│    ├─ TTL cache (lib/cache.ts, in-memory Map)                   │
│    ├─ upstream adapters (lib/apis/news.ts, movies.ts)           │
│    │     ├─ NewsAPI  (NEWS_API_KEY)                             │
│    │     ├─ TMDB      (TMDB_API_KEY)                            │
│    │     └─ social    → built-in mock generator (no upstream)   │
│    └─ fallback chain: fresh cache → stale cache → mock fixtures │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow (read):** UI hook → RTK Query checks cache/dedupe → `fetch('/api/news?…')`
→ route handler validates params → cache lookup → upstream API (or mock) →
normalize to `ContentPage<ContentItem>` → RTK Query caches → component renders
loading/empty/error from `isLoading / isError / data`.

**Data flow (write):** user intent (favorite, reorder, prefs) → dispatch to slice →
middleware persists → selectors re-render affected sections only.

**Why route handlers:** key secrecy (rule 1), one place for caching/rate-limit
handling, and a stable contract (`ContentPage`) regardless of upstream quirks.

**Bonus additions to the architecture:** mock-auth session lives client-side
(`auth` slice + demo credential check against `/mocks` users, no new dependency);
`/app/api/social/stream` SSE route pushes fresh mock social posts every ~20 s,
ingested by RTK Query via `onCacheEntryAdded`; `I18nProvider` (react-i18next)
wraps the app with `en` + `de` resources and a header language switcher.

---

## 2. Types (`/types/content.ts`)

```ts
export type Category =
  | 'technology' | 'business' | 'finance' | 'sports'
  | 'entertainment' | 'science' | 'health' | 'general';
// NewsAPI has no 'finance' → adapter maps finance→business. TMDB genres map
// to entertainment/science/etc. via a lookup table in lib/apis/movies.ts.

interface BaseContentItem {
  id: string;            // namespaced + stable: 'news:abc123', 'movie:42', 'social:7'
  type: 'news' | 'movie' | 'social';
  title: string;
  description: string;
  imageUrl: string | null;
  url: string;           // detail link ('Read More' / 'Play Now' CTA target)
  source: string;        // 'TechCrunch' | 'TMDB' | '@nasa'
  category: Category;
  publishedAt: string;   // ISO 8601
}

export interface NewsItem extends BaseContentItem {
  type: 'news';
  author: string | null;
}

export interface MovieItem extends BaseContentItem {
  type: 'movie';
  rating: number;        // TMDB vote_average, 0–10
  releaseDate: string;   // ISO date
  genres: string[];
  popularity: number;    // TMDB popularity, used for Trending
}

export interface SocialItem extends BaseContentItem {
  type: 'social';
  author: { handle: string; displayName: string; avatarUrl: string | null };
  hashtag: string;       // without '#'
  likes: number;
  reposts: number;
}

export type ContentItem = NewsItem | MovieItem | SocialItem;
```

Shared response/error contracts (`/types/api.ts`):

```ts
export interface ContentPage<T extends ContentItem> {
  items: T[];
  page: number;
  pageSize: number;      // 12
  totalResults: number;
  hasMore: boolean;
  source: 'live' | 'cache' | 'mock';  // shown as a subtle badge; aids debugging
}

export interface ApiErrorBody {
  error: {
    code: 'BAD_REQUEST' | 'UPSTREAM_ERROR' | 'RATE_LIMITED' | 'NOT_FOUND' | 'INTERNAL';
    message: string;     // human-readable, safe to display
  };
}
```

---

## 3. Redux Store Design (`/store`)

State shape:

```ts
interface RootState {
  preferences: { categories: Category[]; hashtags: string[] };   // persisted
  favorites:   { byId: Record<string, ContentItem> };            // persisted (full item snapshot)
  feedOrder:   { manualOrder: string[] };                        // persisted (dragged ids)
  theme:       { mode: 'light' | 'dark' | 'system' };            // persisted
  auth:        { user: { name: string; avatarUrl: string | null } | null }; // persisted (M11)
  locale:      { lang: 'en' | 'de' };                            // persisted (M13)
  search:      { query: string };                                // ephemeral
  [contentApi.reducerPath]: ApiState;                            // RTK Query, never persisted
}
```

Slices (`/features`): `preferencesSlice` (toggle category/hashtag, max 5 categories),
`favoritesSlice` (add/toggle/remove — stores the full `ContentItem` snapshot so the
Favorites section renders without refetching and works offline), `feedOrderSlice`
(`reordermoved`),
`themeSlice`, `searchSlice`, plus `authSlice` (M11) and `localeSlice` (M13).

**Division of labor.** RTK Query owns *server state*: fetching, caching, dedupe,
loading/error flags, pagination merge — things that describe data living on a server.
Slices own *client state*: user intent and UI facts (prefs, favorites, order, theme)
that no server owns. This avoids duplicating cache logic in hand-written thunks and
keeps persisted state small and serializable (we never persist query caches).

**Persistence** (`lib/persistence.ts`, no new dependency — see Decisions §2):

- Custom middleware subscribes to whitelisted slices (`preferences`, `favorites`,
  `feedOrder`, `theme`; later `auth`, `locale`), debounced (250 ms) write to `localStorage` key
  `pcd:state:v1` (single JSON payload with `version` for future migrations).
- Rehydration at store creation, client-only (`typeof window !== 'undefined'`),
  try/catch on JSON.parse → fall back to defaults.
- Theme additionally applies via a tiny pre-hydration inline script in the root
  layout (sets `.dark` on `<html>`) to avoid flash-of-wrong-theme; store only
  syncs the preference afterwards.
- SSR safety: components read persisted state after hydration; feed is
  client-rendered below a static shell so SSR markup matches.

---

## 4. API Design (`/app/api/*`)

| Endpoint | Query params | Upstream |
|---|---|---|
| `GET /api/news` | `category` (comma list), `page` (1+), `q` | NewsAPI `top-headlines` |
| `GET /api/movies` | `category`, `page`, `q` | TMDB `/discover` + `/search` |
| `GET /api/social` | `hashtag` (comma list), `page`, `q` | built-in mock generator |

Validation: unknown params ignored; `page` clamped 1–10; `q` trimmed, max 80 chars;
violations → `400 ApiErrorBody(BAD_REQUEST)`.

Success → `200 ContentPage<T>` (shape above). Failure → `ApiErrorBody` with
matching status (`429 RATE_LIMITED`, `502 UPSTREAM_ERROR`, `500 INTERNAL`).

**NewsAPI free-tier handling** (100 req/day, server-side OK):

1. **In-memory TTL cache** (`lib/cache.ts`): key = `${endpoint}:${sorted params}`;
   TTL news 10 min, movies 60 min, social 5 min. RTK Query dedupe protects
   further on the client side.
2. **Fallback chain** on upstream failure/429: fresh cache → stale cache →
   `/mocks` fixtures, with `source: 'mock'` (or `'cache'`) so the UI stays usable
   and the degradation is visible.
3. **Missing key** (`NEWS_API_KEY` unset): serve mock fixtures immediately — the
   app is fully functional with zero keys, which also makes CI/Playwright hermetic.
4. `.env.example` documents `NEWS_API_KEY`, `TMDB_API_KEY` (+ `TMDB_READ_ACCESS_TOKEN`
   if needed); `.env` gitignored (rule 1).

---

## 5. Feed Algorithm (`/features/feed/buildFeed.ts`, pure function)

```
buildFeed(news[], movies[], social[], prefs, manualOrder) → ContentItem[]
1. Filter:     news  where category ∈ prefs.categories (default ['general'])
               social where hashtag   ∈ prefs.hashtags   (default: all)
               movies where category  ∈ prefs.categories ∩ movie-mappable (default: all)
2. Sort:       news/social by publishedAt desc; movies by popularity desc
3. Interleave: deterministic weighted round-robin, ratio 2:1:1 (news:movie:social),
               skipping exhausted streams — no randomness, stable across renders
4. Apply order: items whose id ∈ manualOrder are placed at their manual positions
               (stable partition); remaining ids appended in interleaved order
```

- **Trending** (`/features/feed/trending.ts`, pure): score per type —
  news: `1/ageHours` × source weight; movies: `popularity`; social:
  `log(1 + likes + 2·reposts)`. Top 10 across all types.
- **Search** (`q` param, client debounce 300 ms): server-filtered results across
  all three endpoints, merged with the same interleave.
- **Infinite scroll:** `IntersectionObserver` sentinel hook (`useInfiniteScroll`)
  triggers next `page`; RTK Query `merge` + `serializeQueryArgs` (page excluded
  from cache key) accumulates pages. No new dependency.

---

## 6. Component Tree (props summarized; each file < 150 lines, JSDoc'd)

```
AppLayout (app/layout.tsx)  — Providers(store), ThemeScript, skip-to-content
└── DashboardPage (app/page.tsx)
    ├── Sidebar                     { activeSection, onNavigate }
    │   └── NavLink                 { href, label, icon, isActive }
    ├── Header
    │   ├── SearchBar               { query, onQueryChange }   // debounced in feature
    │   ├── ThemeToggle             { mode, onToggle }
    │   └── AccountMenu             { name, avatarUrl }        // mock account
    ├── FeedSection                 { prefs, manualOrder, onReorder }
    │   ├── FeedToolbar             { activeFilters, onClear }
    │   ├── DndContext (dnd-kit; KeyboardSensor + PointerSensor)
    │   │   └── SortableContext
    │   │       ├── ContentCard (sortable wrapper)
    │   │       │   ├── NewsCard    { item: NewsItem, isFavorite, onToggleFavorite }
    │   │       │   ├── MovieCard   { item: MovieItem, isFavorite, onToggleFavorite }
    │   │       │   └── SocialCard  { item: SocialItem, isFavorite, onToggleFavorite }
    │   │       └── CardSkeleton    { variant }   // ×pageSize while loading
    │   ├── EmptyState              { message, hint }
    │   └── ErrorState              { message, onRetry }
    ├── TrendingSection             { items, onOpen }
    ├── FavoritesSection            { items, onRemove, onClearAll }
    ├── SearchResultsSection        { query, results, status }
    └── SettingsPanel (slide-over)
        └── PreferencesForm         { prefs, onToggleCategory, onToggleHashtag }
```

Stateless presentational cards receive `item` + callbacks; containers own hooks and
dispatch. A11y: landmarks (`nav/header/main`), aria-labels, focus rings, and dnd-kit
keyboard sensor (Space to lift, arrows to move, Space to drop) with visible drop
announcements via `aria-live`.

---

## 7. Persistence Summary

| What | Where | Key | Why |
|---|---|---|---|
| Preferences (categories, hashtags) | `preferences` slice | `pcd:state:v1` | requirement: survive reload |
| Favorites | `favorites.byId` (full item) | same | Favorites view must render offline/refetch-free |
| Card order | `feedOrder.manualOrder` | same | dragged layout survives reload |
| Theme | `theme.mode` + pre-hydration script | same | no FOUC |
| Search query | — | not persisted | ephemeral UI state |
| RTK Query cache | — | never persisted | server state is re-fetchable; keeps storage small |

Migration: `version` field in payload; unknown version → discard and use defaults.

---

## 8. Testing Strategy

| Level | Tool | Scope | Key cases |
|---|---|---|---|
| Unit | Vitest | pure logic | `buildFeed` (interleave ratios, manual order precedence, empty prefs), `trending` scoring, reducers (favorite toggle, pref toggle caps), persistence middleware (debounce, versioning, corrupt JSON), route-handler fallback chain (mock `fetch`: 200 / 429 / missing key), debounce hook, auth reducer (login/logout/session), SSE merge path (prepend + dedupe by id) |
| Integration | Vitest + RTL + MSW | component + store + RTK Query against MSW handlers | FeedSection: loading skeletons → data; empty state; error state + retry; search debounce fires once per 300 ms; favorite toggle updates Favorites section; preference change triggers refetch; DnD reorder updates store; live-update path prepends new posts without a full refetch (mocked stream); locale switch re-renders translated strings |
| E2E | Playwright (external APIs mocked at network layer) | real browser flows | dashboard loads with all sections; search flow end-to-end; drag-and-drop reorder persists after reload; theme toggle persists; preference change filters feed; favorite add/remove persists; login → profile customization → logout; language switch persists |

Every data-driven component test asserts all three states (rule 4). MSW handlers in
`/mocks/handlers.ts` are the single source of fixtures for both Vitest and dev-mode
mock serving. Playwright config runs against a dev server with no real keys
(`source: 'mock'` path).

---

## 9. Requirement Traceability

| # | Requirement (assignment §) | Milestone(s) |
|---|---|---|
| R1 | Preferences panel, persisted (§1) | M2, M6 |
| R2 | Fetch News / Recommendations / Social APIs (§1) | M3 |
| R3 | Content cards: image, headline, description, CTA (§1) | M5 |
| R4 | Infinite scroll / pagination (§1) | M5 |
| R5 | Responsive layout: sidebar + header w/ search, settings, account (§2) | M4 |
| R6 | Unified personalized feed (§2) | M5 (+M2 algorithm) |
| R7 | Trending section (§2) | M9 |
| R8 | Favorites: mark + section (§2) | M5 (toggle), M9 (section) |
| R9 | Cross-category search (§3) | M7 |
| R10 | Debounced search (§3) | M7 |
| R11 | Drag-and-drop reorder (§4) | M8 |
| R12 | Dark mode via CSS vars + Tailwind (§4) | M4 |
| R13 | Animations: transitions, loaders, hover (§4) | M5, M9 |
| R14 | Redux Toolkit global state (§5) | M2 |
| R15 | Async logic via RTK Query (§5) | M3 |
| R16 | localStorage persistence (§5) | M2 |
| R17 | Unit tests incl. edge cases (§6) | M2, M3, M7 (ongoing) |
| R18 | Integration tests: fetch, empty, error (§6) | M5 |
| R19 | E2E: search, DnD, auth flow (§6) | M10, M11 |
| B1 | Bonus: authentication + profile customization (§7) | M11 |
| B2 | Bonus: realtime feed via SSE (§7) | M12 |
| B3 | Bonus: multi-language via react-i18next (§7) | M13 |
| S1 | README + demo video + live link (§Submission) | M10 |

**Evaluation criteria → where demonstrated:**
Functionality → R1–R10 (M2–M9) · Code Quality → rule 6/7 + pure `lib` functions ·
UI/UX + WCAG → M4, M5, M8, M9 (+ M10 audit) · State Management → M2, M3 ·
Performance → debounce (M7), pagination/merge (M5), TTL caching (M3), memoized selectors ·
Testing → M2–M10 suites · Creativity → bonus features + trending scoring + degraded-mode badge ·
Security → M3 route handlers, key secrecy, no secrets in repo (rule 1).

---

## 10. Milestones (each ≤ 2 h, ends with `npm run lint && npm run typecheck && npm test` + conventional commit)

- **M1 — Scaffold.** create-next-app (TS strict, App Router, Tailwind), ESLint,
  folder skeleton per rule 3, `npm run typecheck` script, `.env.example`, Vitest
  smoke test.
  *AC:* `npm run dev` serves; all three scripts pass; empty test green. `chore:`
- **M2 — Types, mocks, store.** `/types` (ContentItem, ContentPage, ApiError),
  `/mocks` fixtures + MSW handlers, slices + persistence middleware + theme slice,
  unit tests for reducers/persistence.
  *AC:* reducer + persistence tests green; store rehydrates in browser. `feat:`
- **M3 — API layer.** 3 route handlers with validation, TTL cache, fallback chain,
  mock social generator; RTK Query `contentApi` + typed hooks; unit tests for
  fallback (429/missing key) and response normalization.
  *AC:* `curl` each endpoint returns contract shape incl. a 400 and a mock-mode
  response; tests green. `feat:`
- **M4 — Layout shell + theme.** Sidebar, Header (SearchBar, ThemeToggle,
  AccountMenu), responsive grid, dark mode via CSS vars, FOUC script, focus rings.
  *AC:* theme persists across reload without flash; layout usable at 375 px & 1280 px. `feat:`
  *Done:* §6's single `DashboardPage` became a `(dashboard)` route group — `/`,
  `/trending`, `/favorites`, `/settings` — so active-route highlighting
  (`aria-current="page"`) and AnimatePresence page transitions are real;
  sidebar items are routes, not in-page anchors. Settings is a route (not the
  planned slide-over) and ships the `PreferencesForm` category chips early
  (M6 keeps feed-refetch-on-change + hashtags). SearchBar holds local state
  until M7. Tailwind v4 expresses `darkMode: 'class'` as
  `@custom-variant dark` in `globals.css`. Verified: 69 unit tests, 22
  Playwright behavioral checks (no-flash reload, drawer focus trap, collapse,
  skip link), screenshots at 375/1280 in both themes.
- **M5 — Feed.** FeedSection + 3 card variants, skeletons/empty/error, favorite
  toggle, infinite scroll, subtle Framer Motion hovers; integration tests (MSW).
  *AC:* feed renders 3 item types; all three UI states provable in tests. `feat:`
- **M6 — Preferences.** SettingsPanel + PreferencesForm wired to store; feed
  refetches on change; persistence verified.
  *AC:* changing prefs filters feed and survives reload; unit + integration tests. `feat:`
- **M7 — Search.** `useDebouncedValue`, search wiring to `q` params, results
  section across types; tests.
  *AC:* one request per 300 ms pause while typing; results show all types. `feat:`
- **M8 — Drag & drop.** dnd-kit sortable feed, KeyboardSensor, `feedOrder`
  persistence, `aria-live` announcements, `prefers-reduced-motion` disables animations.
  *AC:* reorder by mouse **and keyboard**, persists after reload; tests. `feat:`
- **M9 — Trending, Favorites, polish.** TrendingSection (scoring), FavoritesSection,
  section transitions, final a11y pass (contrast, labels).
  *AC:* both sections render from store-only data; axe/manual a11y checks pass. `feat:`
- **M10 — E2E + submission.** Playwright suite (search, DnD, theme, prefs,
  favorites), README (setup, user flow, architecture), a11y/Lighthouse pass,
  demo-video script, optional deploy.
  *AC:* `npx playwright test` green; README complete. `test:` + `docs:`

### Bonus milestones (selected 2026-10-02; core M1–M10 stays submission-ready without them)

- **M11 — Mock auth + profile.** Login/logout via mock credential check against
  `/mocks` users, session in an `auth` slice (persisted), gated AccountMenu with
  profile customization (display name, avatar). No new dependency (NextAuth
  deferred — not needed for demo-grade mock auth).
  *AC:* login → personalized account info in header → logout resets; reload keeps
  session; unit + integration tests. `feat:`
- **M12 — Realtime social feed (SSE).** `GET /api/social/stream` route handler
  streams a new mock `SocialItem` every ~20 s (respecting prefs); client hook
  feeds RTK Query `onCacheEntryAdded` to prepend items (dedupe by id); "live"
  indicator with `aria-live`; new posts animate in unless reduced motion.
  *AC:* posts appear without user action; no upstream API cost (mock only);
  tests cover the merge path. `feat:`
- **M13 — i18n.** `react-i18next` + `i18next` (deps approved via bonus selection),
  `/lib/i18n` resources `en` + `de`, header LanguageSwitcher, persisted locale,
  full pass replacing hardcoded strings.
  *AC:* switcher changes all chrome + card labels; persists across reload;
  typecheck clean with typed resources. `feat:`

---

## Decisions (resolved 2026-10-02)

1. **Bonus features** (B1–B3): **all three selected** — mock auth (M11), realtime
   SSE feed (M12), multi-language react-i18next (M13). Ordered after M10 so the
   core app is submission-ready first.
2. **Persistence dependency**: **custom localStorage middleware** (no new deps,
   per rule 9).
3. **External APIs**: **NewsAPI + TMDB keys available** (both provided); social
   remains the built-in mock generator (assignment explicitly allows it).
4. **Dependencies approved**: `react-i18next`, `i18next` (M13). Everything else
   uses the existing stack.
5. **Live demo**: default = attempt Vercel deploy in M10 if time remains.
