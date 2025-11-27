# News Platform (Phase 1)

A TypeScript + Express service scaffold for ingesting, analyzing, and alerting on news and market signals. The project follows the layered architecture described in `docs/architecture.md`.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Environment variable `DATABASE_URL` pointing to a PostgreSQL database
  (e.g., `postgresql://user:password@localhost:5432/news`)
- Optional `SIGNAL_CONFIG_PATH` to override the default `configs/signal_configs/default.json`

## Installation

```bash
npm install
```
##Development
```bash
npm run dev
```
The service starts on PORT (default 3000) and exposes the following endpoints:

GET /health

GET /news

GET /news/:id

GET /alerts

GET /alerts/:id

POST /admin/re-analyze-news/:id

These endpoints are wired through a layered architecture (routes → services → repositories) and use rule-based analysis plus configurable signal/alert generation as described in docs/architecture.md. The news and alert endpoints return raw news along with the latest analysis, associated signals, and alert summaries. Signal weights and thresholds are loaded from `configs/signal_configs` (or the path provided via `SIGNAL_CONFIG_PATH`).

## Scheduler

- The scheduler runs with `node-cron` to insert stub news, analyze them, and generate alerts automatically.
- Configure cadence with `SCHEDULER_CRON` (defaults to `*/5 * * * *`) and per-run stub count with `SCHEDULER_STUB_BATCH` (defaults to 2).
- Set `DISABLE_SCHEDULER=true` to prevent the cron job from running (useful for local tests or one-off scripts).

Build and Run
```bash
npm run build
npm start
```
This compiles the TypeScript sources to dist/ and starts the compiled server.

Database Migrations

Prisma is configured for schema management and migrations under the prisma/ directory.

Apply existing migrations (recommended for CI/CD or fresh environments):
```bash
npm run migrate
```
Develop and create a new migration after editing prisma/schema.prisma:
```bash
npm run migrate:dev
```
These commands require DATABASE_URL to be set and reachable by Prisma.

Testing

Run the built-in unit tests with:
```bash
npm test
```
Project Structure

src/ – Express server entrypoint, routes, services, repositories, and config

prisma/ – Prisma schema and SQL migrations for PostgreSQL

docs/ – Architecture notes and design references

tests/ – Unit tests for core services and API endpoints (may be expanded over time)


