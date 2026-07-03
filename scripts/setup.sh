#!/usr/bin/env bash
# One-shot setup for the Job Application Tracker monorepo.
# Safe to re-run: each step checks its own prior state and skips if already done.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SEED_MARKER=".setup-complete"

log() {
  echo "==> $1"
}

# --- Node.js (via nvm, if available) --------------------------------------
REQUIRED_NODE_MAJOR="$(tr -d '[:space:]' < .nvmrc)"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  log "nvm detected - installing/using Node $REQUIRED_NODE_MAJOR from .nvmrc"
  set +u
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  set -u
  nvm install >/dev/null
  nvm use >/dev/null
else
  log "nvm not found - skipping automatic Node version switch"
  echo "    Install nvm (https://github.com/nvm-sh/nvm) so this project can auto-select Node $REQUIRED_NODE_MAJOR via .nvmrc."
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required but was not found. Install Node.js $REQUIRED_NODE_MAJOR (ideally via nvm) and re-run this script." >&2
  exit 1
fi

NODE_MAJOR="$(node -e 'console.log(process.versions.node.split(".")[0])')"
if [ "$NODE_MAJOR" != "$REQUIRED_NODE_MAJOR" ]; then
  echo "Node.js $REQUIRED_NODE_MAJOR is required (found $(node --version))." >&2
  echo "If you have nvm installed: nvm install && nvm use" >&2
  exit 1
fi
log "Node.js $(node --version) OK"

# --- npm dependencies ----------------------------------------------------
if [ -d node_modules ] && [ -f node_modules/.package-lock.json ]; then
  log "Dependencies already installed, skipping npm install"
else
  log "Installing npm dependencies"
  npm install
fi

# --- Env files -----------------------------------------------------------
if [ -f apps/client/.env ]; then
  log "apps/client/.env already exists, skipping"
else
  cp apps/client/.env.example apps/client/.env
  log "Created apps/client/.env from .env.example"
fi

if [ -f apps/server/.env ]; then
  log "apps/server/.env already exists, skipping"
else
  cp apps/server/.env.example apps/server/.env
  log "Created apps/server/.env from .env.example"
fi

# --- Database (Postgres via Docker) --------------------------------------
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  log "Starting Postgres (docker compose up -d db)"
  docker compose up -d db

  log "Waiting for Postgres to accept connections"
  READY=false
  for _ in $(seq 1 30); do
    if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
      READY=true
      break
    fi
    sleep 1
  done

  if [ "$READY" != "true" ]; then
    echo "Postgres did not become ready in time. Check 'docker compose logs db'." >&2
    exit 1
  fi
else
  log "Docker not found - skipping automatic Postgres setup"
  echo "    Make sure DATABASE_URL in apps/server/.env points to a reachable Postgres instance."
fi

# --- Prisma client + migrations --------------------------------------------
log "Generating Prisma client"
(cd apps/server && npx prisma generate)

log "Applying database migrations"
(cd apps/server && npx prisma migrate deploy)

# --- Seed data (only once, since it's destructive on re-run) ---------------
if [ -f "$SEED_MARKER" ]; then
  log "Database already seeded, skipping (delete $SEED_MARKER to force reseeding)"
else
  log "Seeding database with sample data"
  npm run db:seed --workspace apps/server
  touch "$SEED_MARKER"
fi

echo ""
echo "Setup complete."
echo ""
echo "Start the API server:  npm run dev:server"
echo "Start the frontend:    npm run dev"