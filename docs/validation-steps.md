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

## 4. Start in development mode

```bash
npm run start:dev
```

Expected: log shows `Application running on port 3000 [development]`, no errors.

## 5. Health endpoint

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","timestamp":"..."}`.

## 6. Swagger available in dev

Open `http://localhost:3000/docs` in browser.

Expected: Swagger UI loads with all documented endpoints.

## 7. Error response format

```bash
curl http://localhost:3000/ruta-que-no-existe
```

Expected: JSON response with shape `{ statusCode: 404, message, error, path, timestamp }`.

## 8. Docker Compose

```bash
docker compose down && docker compose up --build
```

Expected: both `postgres` and `api` start without errors. Logs are structured JSON (production mode). Verify health:

```bash
curl http://localhost:3000/health
```

Stop with `docker compose down` when done.
