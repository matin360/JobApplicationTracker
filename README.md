# Job Application Tracker

This repository contains a monorepo for the Job Application Tracker MVP with a React + TypeScript client, a Node.js + Express API, and a Prisma-managed PostgreSQL database.

## Quick start

1. Install dependencies from the repo root:
   ```bash
   npm install
   ```
2. Create local environment files:
   ```bash
   cp apps/client/.env.example apps/client/.env
   cp apps/server/.env.example apps/server/.env
   ```
3. Start the API server:
   ```bash
   npm run dev:server
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```

The frontend runs on port `3000` and the backend runs on port `4000` by default.

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

## Environment variables

- Frontend: `apps/client/.env` should define `VITE_API_URL` and `VITE_PORT`.
- Backend: `apps/server/.env` should define `PORT` and `DATABASE_URL`.

## Development checks

```bash
npm run lint
npm run build
```
