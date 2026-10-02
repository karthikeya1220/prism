# CLAUDE.md — Permanent Project Rules

## Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **State:** Redux Toolkit + RTK Query
- **Animation:** Framer Motion
- **Drag & drop:** @dnd-kit
- **Unit/integration tests:** Vitest + React Testing Library + MSW
- **E2E tests:** Playwright

## Rules

1. **Secrets:** Never hardcode secrets. All third-party API calls go through Next.js route handlers in `/app/api/*`. Only `.env.example` is committed — never commit `.env`.
2. **Types:** No `any`. Shared types live in `/types`. Use a discriminated union `ContentItem = NewsItem | MovieItem | SocialItem`.
3. **Folder structure:**
   ```
   /app
   /components/{ui,cards,layout,feed}
   /features/{preferences,favorites,feed,search}
   /store
   /lib
   /hooks
   /types
   /mocks
   /tests
   /e2e
   ```
4. **UI states:** Every data-driven view must implement loading (skeleton), empty, and error states.
5. **Accessibility:** Semantic HTML, aria labels, visible focus rings, keyboard-operable drag and drop, AA contrast, respects `prefers-reduced-motion`.
6. **Components:** Stay small (under ~150 lines), with a short JSDoc on each exported component and hook.
7. **Verification:** After every task run `npm run lint && npm run typecheck && npm test`. Fix all failures before reporting done.
8. **Commits:** Commit after each completed task using conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
9. **Dependencies:** Do not add new dependencies without asking first.
10. **Workflow:** Work on one task at a time. When finished, give a 5-line summary: what changed, files touched, how to verify, known gaps.

## Evaluation Criteria

Copied from the assignment brief — always optimize for these:

- **Functionality:** Does the application meet the requirements and provide the intended user experience?
- **Code Quality:** Clean, modular, well-documented code. Proper use of React/Redux conventions.
- **UI/UX Design:** Is the design intuitive, responsive, and aesthetically pleasing? Is the UI accessible (WCAG compliance)?
- **State Management:** Is Redux used effectively for managing state across different sections? Is asynchronous logic handled well?
- **Performance:** Is the app optimized for performance? How is the data fetching optimized (debouncing, pagination)?
- **Testing:** Does the application have sufficient coverage for unit tests, integration tests, and E2E tests?
- **Creativity:** Bonus points for innovative features or designs that go above and beyond the requirements.
- **Security:** Proper handling of sensitive data (e.g., API keys, user authentication).
