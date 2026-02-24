# Local PostgreSQL Setup

Guide to configure PostgreSQL on your machine for local development (without Docker).

## Prerequisites

- PostgreSQL 16+ installed and running
- `psql` CLI available in your PATH

### macOS (Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
```

### Ubuntu / Debian

```bash
sudo apt install postgresql-16
sudo systemctl start postgresql
```

### Windows

1. Download the installer from https://www.postgresql.org/download/windows/
2. Run the installer and follow the wizard (remember the password you set for the `postgres` superuser)
3. The installer adds `psql` to PATH automatically. If not, add `C:\Program Files\PostgreSQL\16\bin` to your system PATH
4. Verify PostgreSQL is running via **Services** (`services.msc`) — look for `postgresql-x64-16`

## 1. Configure environment variables

Copy the example file and set your credentials:

```bash
# macOS / Linux
cp .env.example .env

# Windows (CMD)
copy .env.example .env
```

Edit `.env` with the values you want to use:

```
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=transactions_db
DB_PORT=5432
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/transactions_db
```

> **Important:** Never commit `.env` to the repository. It is already in `.gitignore`.

## 2. Create the database role

Connect to your local PostgreSQL and create the role using the same credentials from `.env`.

> **Note:** On Windows, the installer already creates a `postgres` superuser. If your `DB_USER` is `postgres`, skip this step and go to step 3.

**macOS / Linux:**

```bash
psql -d postgres -c "CREATE ROLE $DB_USER WITH LOGIN SUPERUSER PASSWORD '$DB_PASSWORD';"
```

**Windows (CMD):**

```cmd
psql -U postgres -d postgres -c "CREATE ROLE %DB_USER% WITH LOGIN SUPERUSER PASSWORD '%DB_PASSWORD%';"
```

### Verify the role was created

```bash
# macOS / Linux
psql -d postgres -c "SELECT rolname FROM pg_roles WHERE rolname = '$DB_USER';"

# Windows (CMD)
psql -U postgres -d postgres -c "SELECT rolname FROM pg_roles WHERE rolname = '%DB_USER%';"
```

## 3. Create the database

**macOS / Linux:**

```bash
psql -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
```

**Windows (CMD):**

```cmd
psql -U postgres -d postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;"
```

### Verify the database was created

```bash
# macOS / Linux
psql -d postgres -c "SELECT datname FROM pg_database WHERE datname = '$DB_NAME';"

# Windows (CMD)
psql -U postgres -d postgres -c "SELECT datname FROM pg_database WHERE datname = '%DB_NAME%';"
```

## 4. Test the connection

Using the `DATABASE_URL` from your `.env`:

```bash
# macOS / Linux
psql "$DATABASE_URL" -c "SELECT 1 AS connected;"

# Windows (CMD)
psql %DATABASE_URL% -c "SELECT 1 AS connected;"
```

Expected output:

```
 connected
-----------
         1
(1 row)
```

## 5. Start the application

```bash
npm run start:dev
```

You should see `TypeOrmCoreModule dependencies initialized` in the logs without any connection errors.

## Troubleshooting

### `role "xxx" does not exist`

The role specified in `DB_USER` hasn't been created. Run step 2.

### `database "xxx" does not exist`

The database specified in `DB_NAME` hasn't been created. Run step 3.

### `password authentication failed`

The password in `DATABASE_URL` doesn't match the one set when creating the role. Recreate the role:

```bash
psql -d postgres -c "DROP ROLE $DB_USER;"
psql -d postgres -c "CREATE ROLE $DB_USER WITH LOGIN SUPERUSER PASSWORD '$DB_PASSWORD';"
```

### `connection refused` on port 5432

PostgreSQL is not running. Start it:

```bash
# macOS
brew services start postgresql@16

# Linux
sudo systemctl start postgresql

# Windows — open services.msc and start "postgresql-x64-16", or:
net start postgresql-x64-16
```
