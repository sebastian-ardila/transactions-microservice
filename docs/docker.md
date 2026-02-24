# Docker Documentation

## Dockerfile

Multi-stage build that compiles TypeScript and produces a minimal production image.

### Stage 1: Build

```dockerfile
FROM node:22-alpine AS build
```

- Uses Node 22 Alpine as base (lightweight ~50MB).
- Copies `package*.json` first and runs `npm ci` to leverage Docker layer caching — dependencies are only reinstalled when `package.json` or `package-lock.json` change.
- Copies source code (`src/`, `tsconfig*.json`, `nest-cli.json`) and runs `npm run build` to compile TypeScript into `dist/`.

### Stage 2: Production

```dockerfile
FROM node:22-alpine AS production
```

- Starts from a clean Alpine image (no build artifacts or devDependencies).
- Installs only production dependencies with `npm ci --omit=dev`.
- Copies the compiled `dist/` folder from the build stage.
- Exposes port `3000` and runs `node dist/main.js` directly (no ts-node, no nest CLI overhead).

### Why multi-stage?

- The final image does not contain TypeScript source, devDependencies, or build tools.
- Results in a significantly smaller image (~150MB vs ~500MB single-stage).

---

## docker-compose.yml

Defines two services for local development. All credentials and configuration are read from environment variables (see `.env.example`).

### Services

#### `postgres`

- Image: `postgres:16-alpine`
- Credentials and database name are read from `DB_USER`, `DB_PASSWORD`, `DB_NAME` env vars.
- Data persists across restarts via the `pgdata` named volume.

#### `api`

- Builds from the project Dockerfile.
- Reads `PORT`, `NODE_ENV`, and database credentials from env vars to construct the `DATABASE_URL`.
- Uses `postgres` as the database hostname (Docker Compose service name), not `localhost`.
- Starts after the `postgres` service via `depends_on`.

### Setup

```bash
# 1. Copy and fill in your environment variables
cp .env.example .env

# 2. Start both services
docker compose up --build

# 3. Run in background
docker compose up --build -d

# 4. Stop and remove containers
docker compose down

# 5. Stop, remove containers, AND delete database volume
docker compose down -v
```
