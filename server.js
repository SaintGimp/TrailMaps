"use strict";

/**
 * Module dependencies.
 */

import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import serveFavicon from "serve-favicon";
import morgan from "morgan";
import methodOverride from "method-override";
import lessMiddleware from "less-middleware";
import helmet from "helmet";
import cors from "cors";
import * as dataService from "./domain/dataService.js";
import { generateNonce } from "./middleware/cspNonce.js";

// ES6 module equivalents of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Configuration

app.set("port", process.env.VMC_APP_PORT || process.env.PORT || 3000);
app.set("views", __dirname + "/views");
app.set("view engine", "pug");
app.set("trust proxy", 1); // Trust the first proxy (Azure App Service)

// Generate CSP nonce for each request
app.use(generateNonce);

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : ["http://localhost:3000"]; // Default for dev

const corsOptions = {
  /**
   * @param {string} origin
   * @param {function(Error | null, boolean=): void} callback
   */
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Security headers via Helmet
app.use(
  helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],

        // Scripts: self, inline with nonce, and external map APIs
        scriptSrc: [
          "'self'",
          /**
           * @param {import("express").Request} req
           * @param {import("express").Response} res
           */
          (req, res) => `'nonce-${res.locals.cspNonce}'`, // Allow inline scripts with nonce
          "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/", // Bootstrap 5.3.2
          "https://atlas.microsoft.com/sdk/javascript/", // Azure Maps SDK
          "https://maps.googleapis.com", // Google Maps API
          "https://unpkg.com/@googlemaps/", // Google Maps markerwithlabel
          "https://js.api.here.com" // HERE Maps v3.3.0
        ],

        // Styles: self, inline styles, and external map stylesheets
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for inline styles and some map APIs
          "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/", // Bootstrap 5.3.2
          "https://atlas.microsoft.com", // Azure Maps SDK styles
          "https://js.api.here.com", // HERE Maps v3.3.0 styles
          "https://fonts.googleapis.com" // Google Fonts styles
        ],

        // Images: self, data URIs, and map tile servers
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://*.tile.openstreetmap.org", // OpenStreetMap tiles (if used)
          "https://atlas.microsoft.com", // Azure Maps images and sprites
          "https://*.virtualearth.net", // Bing/Azure Maps tiles
          "https://maps.googleapis.com", // Google Maps images
          "https://*.googleapis.com", // Google APIs content
          "https://*.gstatic.com", // Google static content
          "https://*.here.com" // HERE Maps tiles and images
        ],

        // Fonts: self and CDNs
        fontSrc: [
          "'self'",
          "data:",
          "https://cdn.jsdelivr.net/npm", // Bootstrap and other CDN fonts
          "https://fonts.gstatic.com", // Google Fonts
          "https://atlas.microsoft.com" // Azure Maps fonts
        ],

        // Connect: API calls and map tile fetching
        connectSrc: [
          "'self'",
          "data:", // Allow data URIs for dynamic image loading
          "https://atlas.microsoft.com/", // Azure Maps API and tiles
          "https://*.virtualearth.net/", // Bing/Azure Maps tile servers
          "https://unpkg.com/", // Google Maps markerwithlabel and other packages
          "https://maps.googleapis.com/", // Google Maps API
          "https://*.googleapis.com/", // Google APIs
          "https://*.here.com/", // HERE Maps API and tiles
          "https://cdn.jsdelivr.net/" // Bootstrap and all CDN resources
        ],

        // Workers: for map rendering if needed
        workerSrc: ["'self'", "blob:"],

        // Child/frame sources: none needed
        frameSrc: ["'none'"],

        // Object/embed: none needed
        objectSrc: ["'none'"],

        // Base URI: restrict to self
        baseUri: ["'self'"],

        // Form actions: self only
        formAction: ["'self'"]
      }
    },

    // Strict Transport Security (HSTS)
    // Only enable in production with HTTPS
    strictTransportSecurity:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
          }
        : false,

    // Prevent clickjacking
    frameguard: {
      action: "deny" // Don't allow site to be framed
    },

    // Prevent MIME type sniffing
    noSniff: true,

    // XSS Protection (legacy but doesn't hurt)
    xssFilter: true,

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false
    },

    // Don't send referrer to external sites
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    }
  })
);

app.use(serveFavicon("public/images/favicon.ico"));
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(lessMiddleware(path.join(__dirname, "public"), {}, {}, { compress: true }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
import apiRoutes from "./routes/api.js";
import homeRoutes from "./routes/home.js";
apiRoutes(app);
homeRoutes(app);

app.use(function (req, res) {
  res.sendStatus(404);
});

// Initialize Cosmos DB connection and start server
async function startServer() {
  try {
    await dataService.connect();
    console.log("Cosmos DB connection established");

    const serverInstance = app.listen(app.get("port"), function () {
      console.log("Node server version %s", process.version);
      console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);
      serverInstance.close(async () => {
        await dataService.close();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to connect to Cosmos DB:", error);
    process.exit(1);
  }
}

// Only start server if this file is run directly (not imported as module)
// Check if this is the main module by comparing resolved paths
const isMainModule =
  process.argv[1] &&
  (import.meta.url === new URL(process.argv[1], `file://${process.cwd()}/`).href ||
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/")));

if (isMainModule) {
  startServer();
}
