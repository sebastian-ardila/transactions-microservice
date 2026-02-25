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
- [Kubernetes](#kubernetes)
- [Documentation](#documentation)

## Prerequisites

- Node.js 22+
- npm 10+
- PostgreSQL 16+ (for local development) — see [Local PostgreSQL Setup](docs/local-postgres-setup.md)
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

## Kubernetes

Kubernetes manifests are in the [`k8s/`](k8s/) directory (Deployment, Service, ConfigMap, Secret). To deploy locally:

```bash
# Build the image
docker build -t transactions-api .

# Apply manifests
kubectl apply -f k8s/

# Access via port-forward
kubectl port-forward svc/transactions-api 3000:80
```

For the full setup guide see [Kubernetes Deployment](docs/kubernetes.md).

## API Endpoints

### System

| Method | Route         | Description                   |
|--------|---------------|-------------------------------|
| GET    | /health       | General health check          |
| GET    | /health/live  | Liveness probe (Kubernetes)   |
| GET    | /health/ready | Readiness probe (Kubernetes)  |
| GET    | /docs         | Swagger (dev only)            |

### Transactions

| Method | Route                       | Description                  |
|--------|-----------------------------|------------------------------|
| POST   | /transactions               | Create a transaction         |
| GET    | /transactions/user/:userId  | Get transaction history by user |

### Users

| Method | Route                   | Description         |
|--------|-------------------------|---------------------|
| GET    | /users/:userId/balance  | Get user balance    |

## Scripts

| Command              | Description                |
|----------------------|----------------------------|
| `npm run start:dev`  | Dev server with hot-reload |
| `npm run build`      | Compile TypeScript         |
| `npm run start:prod` | Run production build       |
| `npm test`           | Run tests                  |
| `npm run test:cov`   | Tests with coverage        |
| `npm run test:e2e`   | Integration tests (e2e)    |
| `npm run lint`       | Run ESLint                 |
| `npm run format`     | Run Prettier               |
| `npm run migration:generate` | Generate a new migration from entity changes |
| `npm run migration:run`      | Run pending migrations     |
| `npm run migration:revert`   | Revert the last migration  |

## Project Structure

```
src/
├── main.ts                  # Bootstrap, global pipes/filters, Swagger
├── app.module.ts            # Root module
├── config/                  # Environment and logger configuration
├── common/                  # Shared filters, pipes, utilities
├── database/                # TypeORM + PostgreSQL connection, migrations
└── modules/                 # Feature modules
    ├── health/              # Health check endpoint
    ├── users/               # User entity, service, and controller
    │   └── entities/        # User entity
    └── transactions/        # Transaction entity, service, and controller
        ├── dto/             # Request DTOs
        └── entities/        # Transaction entity, TransactionType enum
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
| [Local PostgreSQL Setup](docs/local-postgres-setup.md) | Configure PostgreSQL for local development |
| [Docker Database Inspection](docs/docker-database-inspection.md) | Inspect PostgreSQL tables in Docker |
| [Kubernetes Deployment](docs/kubernetes.md)        | Deploy on Kubernetes (Docker Desktop / Minikube) |
| [Validation Steps](docs/validation-steps.md)      | Pre-commit validation checklist          |
