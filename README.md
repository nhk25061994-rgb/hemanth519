# nitara-app

Node.js / Express microservice sample for the Nitara platform.

## Endpoints

| Method | Path           | Description                        |
|--------|----------------|------------------------------------|
| GET    | /health        | Liveness probe (k8s)               |
| GET    | /ready         | Readiness probe — checks DB        |
| GET    | /api/users     | Fetch users from MSSQL             |
| POST   | /api/users     | Create user + publish Kafka event  |
| POST   | /api/upload    | Upload file to MinIO               |

## Local development

```bash
cp .env.example .env      # fill in your local values
npm install
npm run dev               # nodemon auto-reload
```

Visit `http://localhost:8080/health`

## Run tests

```bash
npm test                  # Jest + coverage report
```

## Branch strategy

| Branch       | Jenkins does              | ArgoCD deploys to |
|-------------|--------------------------|-------------------|
| `feature/*`  | build + test only         | —                 |
| `main`       | full CI → update gitops   | DEV (auto)        |
| `release/*`  | full CI → update gitops   | UAT (auto)        |

## Environment variables

All config is injected by Kubernetes via Helm values — see `nitara-gitops/values/`.

| Variable          | Description                     |
|-------------------|---------------------------------|
| `APP_ENV`         | dev / test / uat / stg          |
| `DB_HOST`         | MSSQL hostname (from MZ)        |
| `DB_NAME`         | Database name                   |
| `DB_USER`         | From k8s Secret                 |
| `DB_PASS`         | From k8s Secret                 |
| `MINIO_HOST`      | MinIO endpoint (Vmbr-35/55)     |
| `MINIO_BUCKET`    | Bucket name                     |
| `KAFKA_BROKERS`   | Kafka broker list (from MZ)     |
