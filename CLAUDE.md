# CLAUDE.md — jwt-pizza (frontend)

React + TypeScript + Vite + Tailwind/Preline SPA for **JWT Pizza**, the mastery project for
**BYU CS329 (QA & DevOps)**. Talks to the `jwt-pizza-service` backend for everything, and to the
**JWT Pizza Factory** directly for order verification.

> **This file is committed and public — project context only.** Anything personal (machine paths,
> my git remotes, local setup state, secrets) lives outside this repo: in an untracked `CLAUDE.md`
> in the parent workspace folder, and in a gitignored `CLAUDE.local.md` here. Claude Code loads
> all three; only this one is pushed. **Never add identifying details to this file.**

**For any course question** — assignments, grading, deliverable requirements, AWS/Grafana/
Playwright steps — read the local workspace notes and the course instruction repo they point at
(a clone of <https://github.com/devops329/devops>, outside this repo). Don't guess from memory.

Frontend-relevant instruction: `instruction/jwtPizzaClient/`, `instruction/jwtPizza/`,
`instruction/jwtPizzaData/` (curl seed data), `instruction/jwtPizzaFactory/`,
`instruction/uiTesting/`, `instruction/playwright/`, `instruction/tdd/`,
`instruction/gitHubPages/`, `instruction/staticDeployment/`, `instruction/awsS3/`,
`instruction/awsCloudFront/`, `instruction/awsS3Deployment/`.

Deliverables that land here: **2** (CI → GitHub Pages), **4** (Playwright UI tests + coverage),
**6** (S3 + CloudFront); **1**, **5**, **11**, **12** span both repos.

**[notes.md](notes.md) is the deliverable 1 worksheet** — a table mapping 18 user activities →
frontend component → backend endpoint → SQL. It is a graded artifact; keep it in sync with the code.

**[docs/](docs/) explains the system** (file maps, routing, every activity as a mermaid diagram),
and every source file carries a `@fileoverview` header and TSDoc comments.
**When code changes, update the comment and the doc that describe it.**

---

## Repo layout

```
index.html            entry; loads /index.tsx and ./main.css
index.tsx             ReactDOM root + <BrowserRouter>
main.css              Tailwind directives + custom bits
vite.config.js        istanbul plugin instruments src/ for coverage (dev server only, not `vite build`)
tailwind.config.js    content globs, `wobble` animation, Preline plugin
postcss.config.js     tailwind + autoprefixer
tsconfig.json         strict: true, jsx: "react", target ES2020, moduleResolution "bundler"
playwright.config.js  chromium only, baseURL :5173, starts `npm run dev` itself, 10s timeouts
.nycrc.json           coverage gate: 80% lines, nothing else
eslint.config.js      only the test-file layout rules (see Testing); src/ isn't linted
tests/pizza.spec.ts   the Playwright UI tests, backend fully mocked
.github/workflows/    ci.yml: lint → tests + coverage badge → build → GitHub Pages
.env.development      VITE_PIZZA_SERVICE_URL=http://localhost:3000
.env.production       VITE_PIZZA_SERVICE_URL=https://pizza-service.cs329.click
public/               images, robots.txt, version.json (placeholder 20000101.000000)
notes.md              deliverable 1 worksheet — activity → component → endpoint → SQL
docs/                 file maps, routing, activity flows (mermaid)
incidentReports/      template.md for deliverable 11
deployService.sh      npm run build → stamp version.json → scp to EC2 public_html
src/
  app/app.tsx         ⭐ THE routing + auth hub (see below)
  app/header.tsx      nav from navItems (display: ['nav'])
  app/footer.tsx      nav from navItems (display: ['footer'])
  service/
    pizzaService.ts   Role enum + ALL types + PizzaService interface
    httpPizzaService.ts  the only real implementation; fetch wrapper
    service.ts        indirection: exports `pizzaService` (swap point for test doubles)
  views/              18 route components, each wrapped in <View title>
  components/         breadcrumb, button, card, carousel, quote, slide
  hooks/appNavigation.tsx  useBreadcrumb() — parent/sibling path navigation
  icons.tsx           HeroIcons as components
```

### Architecture — the three things that matter

**1. `src/app/app.tsx` is the center of gravity.** A single `navItems` array declares every route
*and* the nav/footer menus *and* the role-based visibility rules in one place:

```js
{ title: 'Admin', to: '/admin-dashboard', component: <AdminDashboard user={user} />,
  constraints: [isAdmin], display: ['nav'] }
```

- `to` → `<Route path>`; `display` → which of header/footer show the link; `constraints` →
  predicates (`isAdmin`, `loggedIn`, `loggedOut`) gating display.
- **Adding a page means adding one entry here**, not editing three files.
- `user` lives in `App`'s `useState` and is threaded down as a prop; `setUser` is passed to
  Login/Register/Logout. There is no context/store.

**2. Route constraints are cosmetic, not enforcement.** `constraints` only hide *links*. The
`<Route>` is always registered, so `/admin-dashboard` is directly reachable — views defend
themselves by rendering `<NotFound />` when the role check fails (see `adminDashboard.tsx`).
Real authorization is the backend's job.

**3. `service.ts` is a deliberate seam.** Everything imports `{ pizzaService }` from
`../service/service`, which just re-exports `httpPizzaService`. That indirection exists so tests
can swap in a fake implementing the `PizzaService` interface. Use it — don't import
`httpPizzaService` directly from views.

### Data flow

- **Auth token** → `localStorage['token']`, set in `login`/`register`, sent as
  `Authorization: Bearer` by `callEndpoint`. On app mount `getUser()` calls `/api/user/me`, and
  clears the token if it 401s.
- **State between routes** rides on react-router's `location.state`, not a store. The order flow
  is: `menu` (build `order`) → `navigate('/payment', {state:{order}})` → `payment` (POST) →
  `navigate('/delivery', {state:{order, jwt}})` → `delivery` (verify against the Factory).
- **`payment.tsx` is the login gate for ordering** — it redirects to `/payment/login` if there's
  no user, preserving `location.state` so the order survives the round trip.
- **Errors** reject as `{ code, message }` from `callEndpoint`; views catch and set a message
  string. `login.tsx` does `JSON.stringify(error)` — ugly output, a known wart.

### Backend contract

`httpPizzaService` is the complete list of backend calls. Every path here must exist in
`../jwt-pizza-service/src/routes/`:

| Method | Path | Called by |
| --- | --- | --- |
| PUT/POST/DELETE | `/api/auth` | login / register / logout |
| GET | `/api/user/me` | `getUser()` on app mount |
| GET | `/api/order/menu` | menu view |
| GET/POST | `/api/order` | history / place order |
| GET | `/api/franchise?page&limit&name` | menu store picker, admin dashboard |
| GET | `/api/franchise/:userId` | franchise dashboard |
| POST | `/api/franchise` | create franchise (admin) |
| DELETE | `/api/franchise/:id` | close franchise |
| POST/DELETE | `/api/franchise/:id/store[/:storeId]` | create / close store |
| GET | `/api/docs` | docs view |
| POST | `{FACTORY}/api/order/verify` | delivery view — **goes to the Factory, not the service** |

---

## Working in this repo

```sh
npm install
npm run dev        # vite dev server (default :5173), uses .env.development
npm run build      # → dist/
npm run preview
npm run lint       # test-file layout rules
npm test           # Playwright; needs no backend (everything is mocked)
npm run test:coverage   # same, through nyc; fails under 80% lines
```

Playwright needs its browser once per machine: `npx playwright install chromium`.

**The backend must be running first** — `.env.development` points at `http://localhost:3000`.
Start `jwt-pizza-service` (`npm start`) with its MySQL up, then `npm run dev` here.

Seed login after the backend's first run: admin `a@jwt.com` / `admin`. The course's
`instruction/jwtPizzaData/` has curl scripts to create the franchisee (`f@jwt.com`), stores, and
menu items — without them the menu and store picker are empty.

### Conventions

- **TypeScript strict**, `jsx: "react"` (classic runtime — `import React` is required in every
  `.tsx`).
- Function components only. `React.useState` / `useEffect`, no class components, no state library.
- Async work in views goes in an IIFE inside `useEffect`: `useEffect(() => { (async () => {...})(); }, [])`.
- **Tailwind utility classes inline**, no CSS modules. Palette is `bg-gray-800` / `bg-slate-600`
  shells with `orange`/`yellow` accents. Preline supplies nav, modals (`HSOverlay`), carousel.
- Wrap page content in `<View title="...">` for the consistent gradient heading.
- Prettier-ish: 2-space indent, single quotes, semicolons, wide lines (~200 cols). Match it.
- Existing views are the best templates — copy the closest one rather than inventing a pattern.

### Testing

UI tests only: a real browser drives the real frontend, and **every backend and Factory call is mocked**
with `page.route`. Nothing here tests the backend or the frontend↔backend contract; that drift is the
accepted cost of stable tests.

`tests/pizza.spec.ts` has three sections, in this order, and ESLint enforces the split:

1. **Mock data** — typed module constants at the top (`users`, `menu`, `franchises`, `pastOrders`,
   `apiDocs`), typed with `pizzaService.ts` types so frontend type changes flag the mocks.
2. **Mocks** — every `page.route` lives in `basicInit`, run by `test.beforeEach`. Each mock checks the
   request method first, then any request shape, then answers.
3. **Tests** — a `test()` body is only page actions and `expect`s on the page. No `page.route`, no
   `waitForRequest`: request checks belong in the mock. `login` / `register` helpers cover the forms.

Rules for mocks:

- **As simple as possible.** A complicated mock means testing the mock, not the frontend. A mock may
  copy logic only when the real backend has it (the franchise list filters by name like SQL `LIKE`).
- **Mock checks are shape checks** (`expect.any(String)`), never one test's values, since every test
  shares them. They must not be stricter than the backend (it defaults `page`/`limit`/`name`, so the
  mock doesn't require them).
- **Comment style:** a verb when the mock has logic (`// Log in, register, or log out`), a noun when it
  returns fixed data (`// The menu`).
- Locators: `getByRole` with a name; scope duplicates (`getByLabel('Global')` is the header nav,
  `getByRole('contentinfo')` the footer). Wait for something only the next page has — a price that is
  also on the current page makes the test race.

A new test that needs different mock data goes in a `test.describe` with its own `beforeEach`, not a
`page.route` inside the test.

### Git

Branch `main`. This is a student fork of `devops329/jwt-pizza` (`upstream`). Sync from upstream
via GitHub's **"Sync fork"** — **never "Discard commits"**, that would drop the tests and CI work.

### Known warts / landmines

Mostly harmless, but they'll bite during testing deliverables:

1. **`PizzaService.register` signature lies.** The interface declares
   `register(email, password, role)` but `HttpPizzaService.register` and every caller use
   `(name, email, password)`. All three are `string`, so TS structurally accepts it — but a fake
   built from the interface signature will silently mis-map arguments.
   [pizzaService.ts:109](src/service/pizzaService.ts#L109)
2. `getOrders(user)` takes a `user` and ignores it — the backend derives the diner from the token.
3. `callEndpoint` wraps an `async` executor in `new Promise` — a throw before the first `await`
   would escape rather than reject. Works today; don't copy the pattern.
4. `logout()` fires the DELETE without awaiting, then clears the token.
5. `public/version.json` is the placeholder `20000101.000000`; CI stamps the real value.
6. `deployService.sh` builds into `dist/` then `scp`s to `public_html/$service` while the cleanup
   step made `services/$service` — mismatched paths. Superseded by the CI pipeline in deliverable 2.
7. `credentials: 'include'` is set on every fetch but auth is Bearer-token, not cookies.

---

## Related

- **Backend**: [../jwt-pizza-service/](../jwt-pizza-service/) — has its own `CLAUDE.md` with the
  full endpoint map, DB schema, and its own list of (deliberate) security holes.
- **JWT Pizza Factory**: `https://pizza-factory.cs329.click` — external, run by the course.
  Source of the API key, order verification, and the coverage badges in both READMEs.
- **Course content**: <https://github.com/devops329/devops>, cloned locally alongside this repo.
- **Course reference deployment** of this frontend: <https://pizza.cs329.click>.
