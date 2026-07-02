# Job Application Tracker

This repository contains a monorepo for the Job Application Tracker MVP.
It includes:

- A React + TypeScript frontend in `apps/client`
- A Node.js + Express backend in `apps/server`
- A PostgreSQL database schema managed by Prisma
- ESLint configuration for both apps
- A docs folder with product and MVP scope details

## Quick start

1. Install dependencies from the repo root:
   ```bash
   npm install
   ```
2. Copy environment examples:
   ```bash
   cp apps/client/.env.example apps/client/.env
   cp apps/server/.env.example apps/server/.env
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```
4. Start the API server:
   ```bash
   npm run dev:server
   ```

The frontend runs on port `3000` and the backend runs on port `4000` by default.

## Backend database setup

The backend uses Prisma with PostgreSQL.

From `apps/server` you can run:

```bash
npm run db:migrate
npm run db:seed
```

This will apply the Prisma migration and seed the database with sample data.

## Linting

Run the linter across both workspaces:

```bash
npm run lint
```

## Docker

Run the full stack with Docker Compose:

```bash
docker compose up --build
```

This starts:
- frontend on `http://localhost:3000`
- backend on `http://localhost:4000`
- PostgreSQL on `localhost:5432`

## Environment variables

- Frontend: `apps/client/.env` should contain `VITE_API_URL` and `VITE_PORT`.
- Backend: `apps/server/.env` should contain `PORT` and `DATABASE_URL`.

## Notes

- The current Prisma schema lives in `apps/server/prisma/schema.prisma`.
- Seed data is defined in `apps/server/prisma/seed.ts`.
- The database migration folder is `apps/server/prisma/migrations`.
