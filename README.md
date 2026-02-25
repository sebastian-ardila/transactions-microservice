# Transactions Microservice

Microservice responsible for processing and managing financial transactions. Built with NestJS and TypeScript.

## Table of Contents

- [Respuestas a Preguntas Conceptuales - Refacil](#conceptual)
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

## Respuestas a Preguntas Conceptuales - Refacil

1. ¿Cómo manejarías picos altos de transacciones para
garantizar escalabilidad?

Esto ya se esta mitigando parcialmente a traves de las replicas de pods de kubernetes integradas en el manifiesto, alli se crearon 2 replicas y Kubernetes se encarga de hacer el balanceo de carga entre estos pods lo que garantiza un control de trafico un poco mas escalable, se pueden manejar mas replicas si se requiere teniendo cuidado de que el entorno donde se ejecuten soporte esas replicas ya que hay que asignar recursos a cada pod.

Por otro lado, tambien se podria utilizas colas de jobs tipo redis con RabbitMQ, Kafka, BullMQ o lo que sea mas conveniente, de esta manera el cliente recibira una respuesta como cuando un banco le dice a uno que la transaccion esta en proceso y por detras lo que ocurre es que varios jobs se estan ejecutando saliendo de una cola uno a uno y esto garantiza que el sistema no se bloquee ya que se le ofrece un feedback al usuario de que algo se encuentra en ejecucion, por detras ya cada microservicio se encarga de ejecutar el job correspondiente.

Tambien se podria usar caching de requests frecuentes que se hagan a los servicios, por ejemplo, consultar el balance que tiene un usuario en su cuenta podria ser una consulta repetitiva y se podria cachear, pero se tendria que invalidar ese caching si el ususario realiza una transaccion de deposito o retiro ya que el balance cambiaria, esto mejora los tiempos de respuesta en algunas cosas y bajaria picos por altas transacciones pero volveria el sistema mas complejo ya que hay que agregar reglas adicionales en varias transacciones.

2. ¿Qué estrategias usarías para prevenir fraudes en un sistema
de billetera digital?

Lo primero es un sistema de alertas como el que implementé para el punto opcional extra de generar una respuesta atraves de logs para detectar muchas transacciones de monto alto que se generen en poco tiempo. Pero podriamos por ejemplo tambien detectar transacciones desde ubicaciones geograficas distintas en poco tiempo ya sea desde la misma cuenta o hacia la misma cuenta, o quiza transferencias a cuentas recien creadas. Creo que este tipo de reglas primero deben ser concertadas ya que podria ocasionar problemas de compliance si se gestiona mal, por ejemplo bloquear una cuenta por un comportamiento sospechoso en lugar de bloquear una cuenta por un comportamiento ilegal estipulado por la ley o los terminos de servicio de alguna de las partes involucradas.

3. Si detectas lentitud en el procesamiento de transacciones por
alta concurrencia, ¿cómo procederías para mejorar el
rendimiento?

Lo primero es revisar donde esta el problema, evaluar y diagnosticar antes de empezar a hacer algo por suposicion, ya que si corregimos una query porque suponemos que el problema esta alli podriamos duplicar esfuerzos innecesarios ya que quiza ese no era el problema. Asi que primero revisaria donde esta el problema y luego empiezo a generar una solucion apartir de alli con los involucrados correspondientes, ya que el problema podria estar en distintas capas de la aplicacion. Por ejemplo, si el problema esta en que una consulta esta tardando demasiado entonces quiza lo mejor sea optimizar las queries revisano si hay algo que se este gestionando mal o si es necesario ya sea normalizar datos, generar indices, etc. Segundo detectar si por ejemplo es una consulta que se podria cachear, revisar si hay acciones que se podrian encolar para no bloquear el flujo, ver si podemos escalar horizontalmente las replicas de nuestro sistema. Medir cuanto se demoraba el problema si es posible y cuanto se demora cuando se implemente la solucion para tener metricas de mejora continua y evidencia, esto ultimo en una botacora o documentacion nos permiten detectar donde podrian existir nuevos cuellos de botella en el futuro y prevenir si es posible.



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
