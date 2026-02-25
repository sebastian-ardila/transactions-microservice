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
- [Fraud Detection](#fraud-detection)
- [Documentation](#documentation)

## Prerequisites

- Node.js 22+
- npm 10+
- PostgreSQL 16+ (for local development) — see [Local PostgreSQL Setup](docs/local-postgres-setup.md)
- Docker and Docker Compose (for containerized setup)

## Getting Started

Requires PostgreSQL running locally — see [Local PostgreSQL Setup](docs/local-postgres-setup.md).

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Run migrations
npm run migration:run

# Start in development mode
npm run start:dev
```

The API will be available at `http://localhost:3000`. Stop with `Ctrl+C`.

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
    ├── fraud/               # Basic fraud detection (alert-only)
    └── transactions/        # Transaction entity, service, and controller
        ├── dto/             # Request DTOs
        └── entities/        # Transaction entity, TransactionType enum
```

## Fraud Detection

The microservice includes a basic fraud detection mechanism that monitors for suspicious transaction patterns. When a user creates **3 or more transactions with amount > $1,000 within a 5-minute window**, the system logs a warning alert.

This is **alert-only** — transactions are never blocked. The thresholds are configurable via environment variables.

| Variable                    | Description                              | Default |
|-----------------------------|------------------------------------------|---------|
| `FRAUD_TIME_WINDOW_MINUTES` | Time window to evaluate (minutes)        | 5       |
| `FRAUD_MAX_TRANSACTIONS`    | Max high-amount transactions before alert| 3       |
| `FRAUD_AMOUNT_THRESHOLD`    | Minimum amount to consider "high"        | 1000    |

### Testing fraud detection

Use the following curl loop to trigger the fraud alert. Run it in a separate terminal from the server:

```bash
USER_ID="b2c3d4e5-f6a7-4901-bcde-f12345678901"

for i in 1 2 3; do
  curl -s -X POST http://localhost:3000/transactions \
    -H 'Content-Type: application/json' \
    -d "{
      \"transactionId\": \"$(uuidgen | tr '[:upper:]' '[:lower:]')\",
      \"userId\": \"$USER_ID\",
      \"amount\": 1500,
      \"type\": \"deposit\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
    }"
  echo
done
```

All 3 transactions return `201`. On the 3rd transaction, the server logs a **WARN** with `Fraud alert: userId=... has 3 transactions > 1000 in the last 5 minutes`.

#### Local (development mode)

Requires PostgreSQL running locally — see [Local PostgreSQL Setup](docs/local-postgres-setup.md).

```bash
# Start
npm run start:dev

# Run the curl loop in another terminal
# Look for the WARN line with "Fraud alert" in the server output

# Stop
# Ctrl+C in the server terminal
```

The log appears as human-readable colored output (pino-pretty).

#### Docker Compose

```bash
# Start
docker compose up --build

# Run the curl loop in another terminal
# Look for "level":40 and "Fraud alert" in the JSON output

# Stop
# Ctrl+C, then:
docker compose down
```

The log appears as JSON with `"level":40` (WARN in Pino).

#### Kubernetes

Requires Docker Desktop with Kubernetes enabled or Minikube.

```bash
# Start
docker build -t transactions-api .
kubectl apply -f k8s/
kubectl get pods -l app=transactions-api -w
# Wait until pods show Running, then Ctrl+C

# Port-forward and follow logs
kubectl port-forward svc/transactions-api 3000:80 &
kubectl logs -l app=transactions-api --tail=50 -f

# Run the curl loop in another terminal
# Look for "level":40 and "Fraud alert" in the log stream

# Stop
# Ctrl+C to stop logs
kill %1
kubectl delete -f k8s/
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
| FRAUD_TIME_WINDOW_MINUTES | Fraud detection time window (min) | 5  |
| FRAUD_MAX_TRANSACTIONS | Fraud alert transaction threshold | 3     |
| FRAUD_AMOUNT_THRESHOLD | Fraud alert amount threshold      | 1000  |

## Documentation

Additional documentation is available in the [`docs/`](docs/) folder:

| Document                                          | Description                              |
|---------------------------------------------------|------------------------------------------|
| [Docker](docs/docker.md)                          | Dockerfile and docker-compose details    |
| [Local PostgreSQL Setup](docs/local-postgres-setup.md) | Configure PostgreSQL for local development |
| [Docker Database Inspection](docs/docker-database-inspection.md) | Inspect PostgreSQL tables in Docker |
| [Kubernetes Deployment](docs/kubernetes.md)        | Deploy on Kubernetes (Docker Desktop / Minikube) |
| [Validation Steps](docs/validation-steps.md)      | Pre-commit validation checklist          |
