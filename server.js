"use strict";

/**
 * Module dependencies.
 */

var express = require("express"),
  app = exports.app = express(),
  path = require("path"),
  bodyParser = require("body-parser"),
  dataService = require("./domain/dataService.js");

// Configuration

app.set("port", process.env.VMC_APP_PORT || process.env.PORT || 3000);
app.set("host", process.env.VCAP_APP_HOST || process.env.HOST || "localhost");
app.set("views", __dirname + "/views");
app.set("view engine", "pug");
app.use(require("serve-favicon")("public/images/favicon.ico"));
app.use(require("morgan")("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("method-override")());
app.use(require("less-middleware")(path.join(__dirname, "public"), {}, {}, {compress: true }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
require("./routes");

app.use(function(req, res) {
  res.sendStatus(404);
});

// Initialize MongoDB connection pool and start server
async function startServer() {
  try {
    await dataService.connect();
    console.log("MongoDB connection pool established");

    app.listen(app.get("port"), app.get("host"), function(){
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
