'use strict';

/**
 * Module dependencies.
 */

var express = require('express'),
  app = exports.app = express(),
  path = require('path');

// Configuration

app.set('port', process.env.VMC_APP_PORT || process.env.PORT || 3000);
app.set('host', process.env.VCAP_APP_HOST || process.env.HOST || 'localhost');
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(require('static-favicon')());
app.use(require('morgan')({ format: 'dev'}));
app.use(require('body-parser')());
app.use(require('method-override')());
app.use(require('less-middleware')(path.join(__dirname, 'public'), {}, {}, {compress: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('errorhandler')());

// Routes
require('./routes');

app.use(function(req, res, next) {
  res.send(404);
});

// Start server
app.listen(app.get('port'), app.get('host'), function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
