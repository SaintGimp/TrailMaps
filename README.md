TrailMaps
=========

Displays a GPS track and mile markers for various long-distance trails, using three different mapping engines to do so.  This allows the user to select the best possible satellite imagery for any given location.

This project is intended to be useful but is mostly a vehicle for me to learn Node.js and Javascript.

Hosted right now at http://trailmaps.saintgimp.org.

## Development

### Setup
```bash
npm install
```

### Available Scripts

- `npm start` - Start the server
- `npm run dev` - Start the server in development/watch mode
- `npm test` - Run server-side tests
- `npm run test:server` - Run server-side tests explicitly
- `npm run test:client` - Information about client-side tests
- `npm run test:all` - Run linting and server-side tests
- `npm run lint` - Lint all JavaScript files
- `npm run lint:fix` - Lint and auto-fix issues where possible

### Testing
Server tests run via Mocha. Client tests require opening `test/client/runner.html` in a browser.
