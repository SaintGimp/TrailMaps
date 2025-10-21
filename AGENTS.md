# AGENTS.md

## Setup commands

- Install deps: `npm install`
- Start dev server: `node server.js`
- Retrieve the default landing page on server: `curl -s http://localhost:3000/trails/pct/maps/azure`
- Run tests: `npm test` (runs unit tests only)
- Run unit tests: `npm run test:server`
- Run integration tests: `npm run test:integration`
- Run all tests: `npm run test:all` (lints, then unit tests, then integration tests)

## Code style

- Use semicolons at the end of each statement.
- Use double quotes for strings.
- Use functional patterns where possible.
- Avoid the use of emojis in code files, code comments in files, or documentation files unless specifically requested to use them.