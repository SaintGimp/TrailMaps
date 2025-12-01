# TrailMaps

Displays a GPS track and mile markers for various long-distance trails, using three different mapping engines to do so. This allows the user to select the best possible satellite imagery for any given location.

This project is intended to be useful but is mostly a vehicle for me to learn Node.js and Javascript.

Hosted right now at http://trailmaps.saintgimp.org.

## Development

### Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Copy `.env.example` to `.env` and add your Azure Maps subscription key:

```bash
cp .env.example .env
```

Edit `.env` and replace `your-subscription-key-here` with your actual Azure Maps subscription key.

### Available Scripts

- `npm start` - Start the server
- `npm run dev` - Start the server in development/watch mode
- `npm test` - Run server-side tests
- `npm run test:server` - Run server-side tests explicitly
- `npm run test:client` - Information about client-side tests
- `npm run test:all` - Run linting and server-side tests
- `npm run lint` - Lint all JavaScript files with ESLint
- `npm run lint:fix` - Lint and auto-fix issues where possible
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted correctly
- `npm run typecheck` - Validate JSDoc types


### Testing

Server tests run via Mocha. Client tests require opening `test/client/runner.html` in a browser.

### Deployment
These environment variables need to be set in production:
* NODE_ENV: set to `production`
* ALLOWED_ORIGINS: to allow-list the production URL(s).
* MONGO_URI: the back-end database URI
* AZURE_MAPS_SUBSCRIPTION_KEY: key for Azure maps
* GOOGLE_MAPS_API_KEY: key for Google maps
* HERE_API_ID
* HERE_API_CODE