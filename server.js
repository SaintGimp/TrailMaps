'use strict';

// http://brianstoner.com/blog/testing-in-nodejs-with-mocha/
// http://jacobmumm.com/2012/09/11/single-page-apps-with-node-and-angular/
// http://brianstoner.com/blog/testing-in-nodejs-with-mocha/
// http://coenraets.org/blog/2012/10/creating-a-rest-api-using-node-js-express-and-mongodb/
// http://coenraets.org/blog/2012/10/nodecellar-sample-application-with-backbone-js-twitter-bootstrap-node-js-express-and-mongodb/
// http://howtonode.org/testing-private-state-and-mocking-deps
// http://docs.nodejitsu.com/articles/getting-started/how-to-debug-nodejs-applications
// http://webdevchecklist.com/

// https://github.com/Kronuz/SublimeCodeIntel
// http://www.jetbrains.com/webstorm/
// https://github.com/ajaxorg/cloud9
// https://github.com/joyent/node/wiki/Using-Eclipse-as-Node-Applications-Debugger
// https://github.com/jhnns/rewire

// Tutorials:
// http://phuu.net/2012/09/13/node-js-in-real-life-part-1.html
// http://tech.flurry.com/regression-testing-api-services-with-restify
// http://www.hacksparrow.com/express-js-tutorial.html
// http://coenraets.org/blog/2012/10/creating-a-rest-api-using-node-js-express-and-mongodb/
// http://javascriptplayground.com/blog/2012/04/node-js-a-todo-app-with-express
// http://www.smartjava.org/content/tutorial-nodejs-and-expressjs-part-i-routers
// http://chrislarson.me/content/chris-larson/beginners-guide-nodejs-socketio-and-express-framework-installation
// http://quickleft.com/blog/getting-started-with-express-in-node
// http://www.nodebeginner.org/

http://brianstoner.com/blog/testing-in-nodejs-with-mocha/

/**
 * Module dependencies.
 */

var express = require('express'),
  path = require('path');

var app = exports.app = express();

// Configuration

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger('dev'));
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
require('./routes');

// Start server
app.listen(app.get('port'), function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
