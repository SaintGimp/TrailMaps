"use strict";

/**
 * Module dependencies.
 */

const appInsights = require("applicationinsights");
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY || "no key");
appInsights.start();

var express = require("express"),
  app = exports.app = express(),
  path = require("path"),
  bodyParser = require("body-parser");

// Configuration

app.set("port", process.env.VMC_APP_PORT || process.env.PORT || 3000);
app.set("host", process.env.VCAP_APP_HOST || process.env.HOST || "localhost");
app.set("views", __dirname + "/views");
app.set("view engine", "jade");
app.use(require("serve-favicon")("public/images/favicon.ico"));
app.use(require("morgan")("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("method-override")());
app.use(require("less-middleware")(path.join(__dirname, "public"), {}, {}, {compress: true }));
app.use(express.static(path.join(__dirname, "public")));

var ai = require("express-ai").loggers(app, process.env.APPINSIGHTS_INSTRUMENTATIONKEY || "no key", true);
app.use(ai.logRequest);
app.use(ai.logErrors);

// Routes
require("./routes");

app.use(function(req, res) {
  res.send(404);
});

// Start server
app.listen(app.get("port"), app.get("host"), function(){
  console.log("Node server version %s", process.version);
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
