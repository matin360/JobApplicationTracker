# Job Application Tracker

This repository contains a monorepo for the Job Application Tracker MVP with a React + TypeScript client, a Node.js + Express API, and a Prisma-managed PostgreSQL database.

## Node version

This project requires Node **22** (see `.nvmrc`), and `npm install`/`npm ci` will refuse to run on any other version (`engine-strict=true` in `.npmrc`).

If you use [nvm](https://github.com/nvm-sh/nvm), it picks up `.nvmrc` automatically:

```bash
nvm install   # installs Node 22 if you don't already have it
nvm use       # switches this shell to it
```

`./scripts/setup.sh` (below) does this for you automatically if `nvm` is installed.

## Quick start

Run the setup script from the repo root. It switches to the right Node version (via `nvm`, if installed), installs dependencies, creates local `.env` files, starts Postgres (via Docker, if available), and applies migrations + seed data - skipping any step that's already done, so it's safe to re-run:

```bash
./scripts/setup.sh
```

Then start the app:

```bash
npm run dev:server   # API on http://localhost:4000
npm run dev          # frontend on http://localhost:3000
```

<details>
<summary>Manual setup (if you'd rather not use the script)</summary>

1. Make sure you're on Node 22 (`nvm use`, if you have nvm - see [Node version](#node-version)), then install dependencies from the repo root:
   ```bash
   npm install
   ```
2. Create local environment files:
   ```bash
   cp apps/client/.env.example apps/client/.env
   cp apps/server/.env.example apps/server/.env
   ```
3. Make sure Postgres is running and reachable at the `DATABASE_URL` in `apps/server/.env` (e.g. `docker compose up -d db`), then apply migrations and seed data - see [Database setup](#database-setup).
4. Start the API server:
   ```bash
   npm run dev:server
   ```
5. Start the frontend:
   ```bash
   npm run dev
   ```
</details>

## Running with Docker

Alternatively, run the whole stack (client, server, and a Postgres database) with Docker Compose:

```bash
docker compose up --build
```

This builds the client and server images and starts Postgres. The frontend is served at `http://localhost:3000` and the API at `http://localhost:4000`. The server container's `VITE_API_URL`/`DATABASE_URL` are set directly in `docker-compose.yml`, so no `.env` files are required for this path.

## Auth flow

The app uses cookie-based sessions for authentication.

- `POST /api/auth/signup` creates a user, hashes the password, creates a session, and returns the signed-in user.
- `POST /api/auth/login` verifies credentials, creates a session, and returns the signed-in user.
- `GET /api/auth/me` returns the current authenticated user for frontend session checks.
- `POST /api/auth/logout` invalidates the current session and clears the auth cookie.

Protected routes require a valid session cookie. If the user is not authenticated, the server returns `401 Unauthorized` and the frontend redirects to the login screen.

## Database setup

From `apps/server` you can run:

```bash
npm run db:migrate
npm run db:seed
```

This applies the Prisma migration and seeds the database with sample data.

`./scripts/setup.sh` does this automatically the first time it's run. It only seeds once (marked by a `.setup-complete` file at the repo root, since seeding wipes existing rows) - delete that file to force a reseed on the next run.

## Environment variables

- Frontend: `apps/client/.env` can optionally define `VITE_API_URL` and `VITE_PORT`. If `VITE_API_URL` is unset, the client calls the API via relative `/api/...` paths, which the Vite dev server proxies to `http://localhost:4000` (or `VITE_API_URL`, if set, as the proxy target).
- Backend: `apps/server/.env` should define `PORT` and `DATABASE_URL`.

## Testing

The project has two layers of tests:

### Unit tests

- **Client** (`apps/client/test/`, [Vitest](https://vitest.dev/) + Testing Library): components and hooks in isolation - the auth form, the `useAuth` hook, the protected-route redirect, and the sign-out flow (button rendering, in-flight state, redirect on success and on failure).
- **Server** (`apps/server/src/*.test.ts`, `node:test`): password hashing, signup validation, and session-cookie authentication. These talk to the real database, so Postgres must be running (`docker compose up -d db`).

Run both from the repo root, or each workspace individually:

```bash
npm test                            # client + server
npm test --workspace apps/client    # client only (Postgres not needed)
npm test --workspace apps/server    # server only (Postgres required)
```

### End-to-end tests

The e2e suite (`e2e/`, [Playwright](https://playwright.dev/)) drives the real stack in a headless browser and covers every page:

- **Login page**: rendering, login/signup mode toggle, client-side validation hints, wrong-credential errors, and a full sign-in flow.
- **Signup**: account creation through the UI and the duplicate-email error.
- **Protected pages**: the unauthenticated redirect to `/login` (for every protected route), dashboard content for signed-in users, and signing out from the user menu (session invalidated server-side, redirect to login).
- **Navigation**: moving between dashboard, applications, and settings via the sidebar, active-link highlighting, the brand link, and the mobile hamburger nav.

One-time setup for the browser binary:

```bash
npx playwright install chromium
```

Postgres must be running (`docker compose up -d db`); `playwright.config.ts` starts the client and server dev servers automatically if nothing is already listening on ports 3000/4000. Note that the dockerized `client`/`server` containers bake the code into their images at build time - stop them (`docker compose stop client server`) or rebuild them if you want the e2e run to reflect local changes.

```bash
npm run test:e2e       # headless run
npm run test:e2e:ui    # interactive UI mode
```

Test accounts are created with unique `e2e-*@example.com` emails on every run, so the suite never collides with existing data.

## Development checks

Run linting and builds:

```bash
npm run lint
npm run build
```

## Frontend auth setup

By default the client calls the API via relative paths (`/api/...`), proxied to the backend by Vite during local development; set `VITE_API_URL` to call the API at an absolute URL instead (this is how the Docker Compose setup connects the two containers). If the backend is not running, the auth check will simply fall back to the logged-out state instead of hanging in a loading loop.

Session cookies use `SameSite=Lax` outside of production, since the client and API are both served from `localhost` (just different ports), which counts as same-site. In production, where the client and API are expected to live on different domains behind HTTPS, cookies use `SameSite=None; Secure` instead.
