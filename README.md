# Job Application Tracker

This repository contains a starter monorepo for the Job Application Tracker product described in the docs.

## What is included

- A React + TypeScript frontend in apps/client
- A Node.js + Express backend in apps/server
- A Prisma schema for the MVP data model
- ESLint configuration for both apps
- Path aliases for the frontend and environment-based configuration
- A documentation folder with the product and MVP scope

## Quick start

1. Install dependencies:
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
4. Start the API:
   ```bash
   npm run dev:server
   ```

The frontend runs on port 3000 and the API runs on port 4000 by default.

## Linting

Run the linter across both apps:

```bash
npm run lint
```

## Docker

You can also run the app in containers with Docker Compose:

```bash
docker compose up --build
```

This starts:
- the frontend on http://localhost:3000
- the backend on http://localhost:4000
- a PostgreSQL database on localhost:5432

## Environment variables

- Frontend: create a client environment file and set VITE_API_URL and VITE_PORT as needed.
- Backend: set PORT and DATABASE_URL in the server environment file.
