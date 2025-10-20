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
import * as dataService from "./domain/dataService.js";
import { generateNonce } from "./middleware/cspNonce.js";

// ES6 module equivalents of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Configuration

app.set("port", process.env.VMC_APP_PORT || process.env.PORT || 3000);
app.set("host", process.env.VCAP_APP_HOST || process.env.HOST || "localhost");
app.set("views", __dirname + "/views");
app.set("view engine", "pug");

// Generate CSP nonce for each request
app.use(generateNonce);

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

// Initialize MongoDB connection pool and start server
async function startServer() {
  try {
    await dataService.connect();
    console.log("MongoDB connection pool established");

    app.listen(app.get("port"), app.get("host"), function () {
      console.log("Node server version %s", process.version);
      console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\nShutting down gracefully...");
      await dataService.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\nShutting down gracefully...");
      await dataService.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

startServer();
