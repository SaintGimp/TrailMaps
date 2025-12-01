# TrailMaps Modernization Roadmap

**Last Updated:** 2025-12-01
**Goal:** Update the application to current Node.js best practices while maintaining its "simple, low-volume" architectural philosophy (Server-Side Rendered, No-Build).

## Phase 1: Observability & Reliability (High Priority)
*Focus: Ensure the app behaves predictably in production and errors are debuggable.*

### 1.1 Structured Logging
- **Current State:** Uses `console.log` and `morgan`. Hard to query or alert on in production.
- **Action:** Replace with a structured JSON logger (e.g., `pino` or `winston`).
- **Benefit:** Machine-readable logs, log levels (INFO, ERROR), and request correlation.

### 1.2 Centralized Error Handling
- **Current State:** Ad-hoc `safeHandler` wrappers in routes.
- **Action:** Implement a standard Express error-handling middleware `(err, req, res, next)`.
- **Action:** Create custom Error classes (e.g., `AppError`, `NotFoundError`) to distinguish between operational errors (user input) and programmer errors (bugs).

### 1.3 Configuration Validation
- **Current State:** `process.env` accessed directly. App might start with missing keys and fail later.
- **Action:** Create a `config/` module that validates all required environment variables (DB URI, API Keys, `ALLOWED_ORIGINS`) at startup using a library like `envalid` or `zod`.
- **Benefit:** Fail-fast behavior prevents runtime configuration crashes.

## Phase 2: DevOps & Developer Experience (Medium Priority)
*Focus: Make it easy to run, test, and deploy the app anywhere.*

### 2.1 Containerization
- **Current State:** No Docker configuration.
- **Action:** Create a production-ready `Dockerfile`.
- **Action:** Create a `.dockerignore` to exclude `node_modules`, tests, and docs.

### 2.2 Local Development Environment
- **Current State:** Requires local MongoDB installation. Integration tests fail without it.
- **Action:** Create `docker-compose.yml` to spin up MongoDB and the App together.
- **Benefit:** "Works on my machine" guarantee; enables running integration tests easily.

### 2.3 CI/CD Pipeline
- **Current State:** None.
- **Action:** Create a GitHub Actions workflow (or similar) to run:
  1. `npm run lint`
  2. `npm run typecheck`
  3. `npm test`
- **Benefit:** Prevents regressions from being merged.

## Phase 3: Testing Maturity (Medium Priority)
*Focus: Increase confidence in changes.*

### 3.1 Fix Integration Tests
- **Current State:** Integration tests exist but fail due to missing DB connection.
- **Action:** Update test harness to connect to the Dockerized MongoDB instance or an in-memory MongoDB for testing.

### 3.2 Client-Side Logic Testing
- **Current State:** Significant logic in `public/js/` (map handling, waypoints) is untested.
- **Action:** Set up a lightweight test runner (e.g., `vitest` with JSDOM) to unit test the vanilla JavaScript modules in `public/js`.

## Phase 4: Maintenance & Security (Ongoing)

### 4.1 Dependency Management
- **Action:** Run `npm audit fix` to resolve known vulnerabilities.
- **Action:** Review `package.json` for unused dependencies (e.g., `coffeescript` was noted in previous audits).

### 4.2 Code Cleanup
- **Action:** Search for and resolve `TODO` comments in the codebase.
- **Action:** Standardize file naming conventions (camelCase vs snake_case).

## Completed Milestones
- ✅ **Modernization:** Migrated to ES Modules and Node.js 20+.
- ✅ **Type Safety:** Implemented JSDoc + TypeScript checking.
- ✅ **Security:** Implemented Helmet (CSP), CORS, Rate Limiting, and Input Validation.
- ✅ **Linting:** Standardized with ESLint and Prettier.
