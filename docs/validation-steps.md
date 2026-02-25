# Pre-Commit Validation Steps

These steps **must pass** before pushing any commit. Run them in order.

## 1. Build

```bash
npm run build
```

Expected: compiles with no errors, generates `dist/` folder.

## 2. Lint

```bash
npm run lint
```

Expected: no lint errors.

## 3. Tests

```bash
npm test
```

Expected: all test suites and tests pass.

## 4. Integration tests (e2e)

```bash
npm run test:e2e
```

Expected: all 24 e2e tests pass (health, transactions, error cases, idempotency, validation, fraud detection).

## 5. Start in development mode

```bash
npm run start:dev
```

Expected: log shows `Application running on port 3000 [development]`, no errors.

## 6. Health endpoints

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

Expected:
- `/health` → `{"status":"ok","timestamp":"..."}`
- `/health/live` → `{"status":"ok"}`
- `/health/ready` → `{"status":"ok"}`

## 7. Swagger available in dev

Open `http://localhost:3000/docs` in browser.

Expected: Swagger UI loads with all documented endpoints.

## 8. Error response format

```bash
curl http://localhost:3000/non-existent-route
```

Expected: JSON response with shape `{ statusCode: 404, message, error, path, timestamp }`.

## 9. Transaction endpoints

```bash
# Create a deposit (creates user if not exists)
curl -s -X POST http://localhost:3000/transactions \
  -H 'Content-Type: application/json' \
  -d '{
    "transactionId": "a1b2c3d4-e5f6-4890-abcd-ef1234567890",
    "userId": "b2c3d4e5-f6a7-4901-bcde-f12345678901",
    "amount": 100,
    "type": "deposit",
    "timestamp": "2026-02-24T12:00:00.000Z"
  }'
```

Expected: `201` with `{ transactionId, userId, amount, type, timestamp, balanceAfter: 100 }`.

```bash
# Get user balance
curl -s http://localhost:3000/users/b2c3d4e5-f6a7-4901-bcde-f12345678901/balance
```

Expected: `200` with `{ userId, balance: 100 }`.

```bash
# Get transaction history
curl -s http://localhost:3000/transactions/user/b2c3d4e5-f6a7-4901-bcde-f12345678901
```

Expected: `200` with array of transactions ordered by timestamp DESC.

```bash
# Idempotency: repeat the same deposit
curl -s -X POST http://localhost:3000/transactions \
  -H 'Content-Type: application/json' \
  -d '{
    "transactionId": "a1b2c3d4-e5f6-4890-abcd-ef1234567890",
    "userId": "b2c3d4e5-f6a7-4901-bcde-f12345678901",
    "amount": 100,
    "type": "deposit",
    "timestamp": "2026-02-24T12:00:00.000Z"
  }'
```

Expected: `201` with same response, balance unchanged (idempotent).

```bash
# Withdraw from non-existent user
curl -s -X POST http://localhost:3000/transactions \
  -H 'Content-Type: application/json' \
  -d '{
    "transactionId": "c3d4e5f6-a7b8-4012-8def-123456789012",
    "userId": "00000000-0000-4000-a000-000000000000",
    "amount": 50,
    "type": "withdraw",
    "timestamp": "2026-02-24T12:00:00.000Z"
  }'
```

Expected: `404` with `User not found`.

```bash
# Balance for non-existent user
curl -s http://localhost:3000/users/00000000-0000-4000-a000-000000000000/balance
```

Expected: `404` with `User not found`.

## 10. Docker Compose

```bash
docker compose down && docker compose up --build
```

Expected: both `postgres` and `api` start without errors. Logs are structured JSON (production mode). TypeORM should log a successful database connection (no connection errors). Migrations run automatically on startup (`migrationsRun: true`). Verify health:

```bash
curl http://localhost:3000/health
```

Verify that migrations created the `users` and `transactions` tables:

```bash
docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c "\dt"
```

Expected: tables `users`, `transactions`, and `migrations` (TypeORM metadata) are listed.

Verify migration was recorded:

```bash
docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT * FROM migrations"
```

Expected: one row for `CreateUsersAndTransactions1740400000000`.

Stop with `docker compose down` when done.

## 11. Fraud detection

Create 3+ deposits with amount > 1000 in quick succession for the same user:

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

Expected: all transactions succeed with `201`. Application logs show a `WARN` message containing `Fraud alert: userId=...` after the 3rd transaction.

## 12. Kubernetes manifests (optional — requires Kubernetes enabled)

```bash
# Build the image
docker build -t transactions-api .

# Apply manifests
kubectl apply -f k8s/

# Verify pods are Running
kubectl get pods -l app=transactions-api

# Verify the service exists
kubectl get svc transactions-api

# Port-forward and test health
kubectl port-forward svc/transactions-api 3000:80 &
curl http://localhost:3000/health

# Cleanup
kubectl delete -f k8s/
```

Expected: two pods reach `Running` status, service is created, health endpoint returns `{"status":"ok","timestamp":"..."}`.
