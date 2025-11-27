# News Service (Stub)

This repository contains a lightweight stub implementation that follows the architecture in `docs/architecture.md` for Phase 1. It uses a simple JSON data store to avoid external dependencies while keeping the repository/service/service layering intact.

## Getting Started

Install dependencies: no external packages are required for this stub.

### Run migrations

```bash
npm run migrate
```

This command initializes `data/db.json` and writes `migrations/001_init.sql` describing the schema.

### Start the server

```bash
npm run dev
```

The service starts on `PORT` (default 3000) and exposes:
- `GET /health`
- `GET /news`
- `GET /news/:id`
- `GET /alerts`
- `GET /alerts/:id`
- `POST /admin/re-analyze-news/:id`

### Scheduler

A simple scheduler inserts stub news and processes analysis/scoring automatically. Set `DISABLE_SCHEDULER=true` to disable it.

### Testing

Run the built-in unit tests with:

```bash
npm test
```
