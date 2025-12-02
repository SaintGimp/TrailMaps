# AGENTS.md

## Setup commands

- Install dependencies: `npm install`
- Start dev server: `node server.js`

## Testing commands

- Retrieve the default landing page on server: `curl -s http://localhost:3000/trails/pct/maps/azure`
- Run server unit tests: `npm run test:server`
- Run integration tests: `npm run test:integration`
- Run eslint: `npm run lint`
- Run a JSDoc type check with tsc: `npm run typecheck`
- Run all tests: `npm run test:all` (runs lint, then type check, then unit tests, then integration tests)

Run all tests (`npm run test:all`) at the end of every task that modifies source code.

## Code style

- Use semicolons at the end of each statement.
- Use double quotes for strings.
- Use functional patterns where possible.
- Avoid the use of emojis in code files, code comments in files, or documentation files unless specifically requested to use them.