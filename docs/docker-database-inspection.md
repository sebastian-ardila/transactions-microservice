# Inspecting the Database in Docker

Guide to connect to PostgreSQL and inspect tables when running with Docker Compose.

## Prerequisites

- Docker containers running (`docker compose up --build`)
- Environment variables configured in `.env` (see `.env.example`)

## Important: Load your environment variables

The `docker compose exec` command does **not** automatically read your `.env` file into the shell. You must either load the variables first or use the values directly.

**Option A — Load variables before running commands:**

```bash
source .env
docker compose exec postgres psql -U $DB_USER -d $DB_NAME
```

**Option B — Use values directly:**

```bash
docker compose exec postgres psql -U <your_db_user> -d <your_db_name>
```

> Replace `<your_db_user>` and `<your_db_name>` with the values from your `.env` file.

All examples below assume you have loaded the variables with `source .env`.

## Connect to the database

```bash
source .env
docker compose exec postgres psql -U $DB_USER -d $DB_NAME
```

This opens an interactive `psql` session inside the container. Type `\q` to exit.

## Common commands

### List all tables

```bash
docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c "\dt"
```

Expected: `users`, `transactions`, and `migrations` tables.

### View table structure

```bash
# Users table
docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c "\d users"

# Transactions table
docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c "\d transactions"
```

Shows columns, data types, constraints, indexes, and foreign keys.

### View table data

```bash
# All users
docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT * FROM users"

# All transactions
docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT * FROM transactions"
```

### View migration history

```bash
docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT * FROM migrations"
```

Shows which migrations have been executed and when.

## Useful psql commands

These work inside an interactive `psql` session:

| Command       | Description                        |
|---------------|------------------------------------|
| `\dt`         | List all tables                    |
| `\d <table>`  | Describe table structure           |
| `\dn`         | List schemas                       |
| `\di`         | List indexes                       |
| `\dT+`        | List custom types (enums)          |
| `\x`          | Toggle expanded display for rows   |
| `\q`          | Exit psql                          |

## Troubleshooting

### `role "-d" does not exist`

The shell variables are not loaded. Run `source .env` before the command, or use the values directly.

### `could not connect to server: No such file or directory`

The PostgreSQL container is not running. Start it with:

```bash
docker compose up --build -d
```

### Tables are empty

Tables exist but have no data — this is expected after a fresh migration. Data will appear once the API processes transactions.
