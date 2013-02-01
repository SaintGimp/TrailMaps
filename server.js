'use strict';

/**
 * Module dependencies.
 */

var express = require('express'),
  path = require('path');

var app = exports.app = express();

// Configuration

app.configure(function(){
  app.set('port', process.env.VMC_APP_PORT || process.env.PORT || 3000);
  app.set('host', process.env.VCAP_APP_HOST || process.env.HOST || 'localhost');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger('dev'));
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('less-middleware')({ src: path.join(__dirname, 'public'), compress: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(app.router);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Routes
require('./routes');

// Start server
app.listen(app.get('port'), app.get('host'), function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
