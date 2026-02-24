# Transactions Microservice

Microservice responsible for processing and managing financial transactions. Built with NestJS and TypeScript.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running with Docker](#running-with-docker)
- [API Endpoints](#api-endpoints)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Documentation](#documentation)

## Prerequisites

- Node.js 22+
- npm 10+
- Docker and Docker Compose (for containerized setup)

## Getting Started

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Start in development mode
npm run start:dev
```

The API will be available at `http://localhost:3000`.

## Running with Docker

```bash
# Start API + PostgreSQL
docker compose up --build

# Run in background
docker compose up --build -d

# Stop services
docker compose down
```

This starts:
- **api** at `http://localhost:3000` (production mode)
- **postgres** at `localhost:5432`

For more details see [Docker documentation](docs/docker.md).

## API Endpoints

### System

| Method | Route   | Description        |
|--------|---------|--------------------|
| GET    | /health | Health check       |
| GET    | /docs   | Swagger (dev only) |

### Transactions

> Coming soon.

## Scripts

| Command              | Description                |
|----------------------|----------------------------|
| `npm run start:dev`  | Dev server with hot-reload |
| `npm run build`      | Compile TypeScript         |
| `npm run start:prod` | Run production build       |
| `npm test`           | Run tests                  |
| `npm run test:cov`   | Tests with coverage        |
| `npm run lint`       | Run ESLint                 |
| `npm run format`     | Run Prettier               |

## Project Structure

```
src/
├── main.ts                  # Bootstrap, global pipes/filters, Swagger
├── app.module.ts            # Root module
├── config/                  # Environment and logger configuration
├── common/                  # Shared filters, pipes, utilities
└── modules/                 # Feature modules
    └── health/              # Health check endpoint
```

## Environment Variables

See [.env.example](.env.example) for all required variables.

| Variable     | Description              | Default       |
|--------------|--------------------------|---------------|
| NODE_ENV     | Environment mode         | development   |
| PORT         | API port                 | 3000          |
| DB_USER      | PostgreSQL user          | —             |
| DB_PASSWORD  | PostgreSQL password      | —             |
| DB_NAME      | Database name            | —             |
| DB_PORT      | PostgreSQL port          | 5432          |
| DATABASE_URL | Full connection string   | —             |

## Documentation

Additional documentation is available in the [`docs/`](docs/) folder:

| Document                                          | Description                              |
|---------------------------------------------------|------------------------------------------|
| [Docker](docs/docker.md)                          | Dockerfile and docker-compose details    |
| [Validation Steps](docs/validation-steps.md)      | Pre-commit validation checklist          |
