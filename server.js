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
import * as dataService from "./domain/dataService.js";

// ES6 module equivalents of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Configuration

app.set("port", process.env.VMC_APP_PORT || process.env.PORT || 3000);
app.set("host", process.env.VCAP_APP_HOST || process.env.HOST || "localhost");
app.set("views", __dirname + "/views");
app.set("view engine", "pug");
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
