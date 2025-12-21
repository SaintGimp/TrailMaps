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

## Phase 3: Testing Maturity (Medium Priority)
*Focus: Increase confidence in changes.*

### 3.2 Client-Side Logic Testing
- **Current State:** Significant logic in `public/js/` (map handling, waypoints) is untested.
- **Action:** Set up a lightweight test runner (e.g., `vitest` with JSDOM) to unit test the vanilla JavaScript modules in `public/js`.

## Phase 4: Maintenance & Security (Ongoing)

### 4.2 Code Cleanup
- **Action:** Search for and resolve `TODO` comments in the codebase.
- **Action:** Standardize file naming conventions (camelCase vs snake_case).
