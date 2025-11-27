# Architecture Overview

## Phase 1

The Phase 1 scope is a single service that exposes HTTP endpoints for health checks, news analytics, market data, and alerting. It is organized into clear layers:

- **Routes (src/routes/)**: Express routers that define HTTP endpoints and parse incoming requests. They call into services and return JSON responses.
- **Services (src/services/)**: Stateless classes that encapsulate domain logic such as analyzing news content, fetching market data, generating trading signals, and creating alerts.
- **Repositories (src/repositories/)**: In-memory data stores that abstract persistence concerns. These will later be replaced by database-backed implementations.
- **Configuration (src/config/)**: Centralized environment variable loading and parsing. All runtime configuration comes from this module.
- **Server (src/server.ts)**: Application entry point wiring middleware, routes, and configuration before starting the HTTP server.

### Data Flow

1. Requests enter via route handlers.
2. Routes coordinate with services to execute business logic.
3. Services rely on repositories for data access and state management.
4. Responses are returned as JSON.

### Runtime

- The server is started from `src/server.ts` and reads configuration via `src/config`.
- Environment variables are parsed once at startup using `dotenv`.
- Express JSON middleware handles request bodies for POST endpoints.

### Next Steps

- Replace in-memory repositories with persistent storage.
- Add validation and authentication layers as needed.
- Expand service logic with real external integrations.
