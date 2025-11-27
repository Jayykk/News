# News Platform (Phase 1)

A TypeScript + Express service scaffold for ingesting, analyzing, and alerting on news and market signals. The project follows the layered architecture described in `docs/architecture.md`.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Environment variable `DATABASE_URL` pointing to a PostgreSQL database (e.g., `postgresql://user:password@localhost:5432/news`)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build and Run

```bash
npm run build
npm start
```

## Database Migrations

Prisma is configured for schema management and migrations under the `prisma/` directory.

- Apply existing migrations (recommended for CI/CD or fresh environments):

```bash
npm run migrate
```

- Develop and create a new migration after editing `prisma/schema.prisma`:

```bash
npm run migrate:dev
```

These commands require `DATABASE_URL` to be set and reachable by Prisma.

## Project Structure

- `src/` – Express server entrypoint, routes, services, repositories, and config
- `prisma/` – Prisma schema and SQL migrations for PostgreSQL
- `docs/` – Architecture notes and design references
