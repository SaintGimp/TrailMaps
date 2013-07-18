var dataService = require("../domain/dataService.js");
var mileMarkers = require("../domain/mileMarkers.js")(dataService);
var waypoints = require("../domain/waypoints.js")(dataService);
var trails = require("../domain/trails.js")(dataService);
var dataImporter = require("../data/dataimporter.js");
var Q = require('q');

module.exports = function(app) {
  app.get('/api/trails/:trailName/milemarkers/:mile', exports.getMileMarker);
  app.get('/api/trails/:trailName/waypoints/typeahead/:text', exports.getWaypointTypeaheadList);
  app.get('/api/trails/:trailName/waypoints/:name', exports.getWaypoint);
  app.delete('/api/trails/:trailName/waypoints/:id', exports.deleteWaypoint);
  app.get('/api/trails/:trailName/waypoints', exports.getWaypoints);
  app.get('/api/trails/:trailName', exports.getTrailData);
  app.post('/api/admin/importdata', exports.importdata);
};

exports.getTrailData = function (req, res, next) {
  var options = {
    trailName: req.params.trailName,
    north: req.query.north,
    south: req.query.south,
    east: req.query.east,
    west: req.query.west,
    detailLevel: req.query.detail
  };

  trails.findByArea(options)
  .done(
    function(trailData) {
      res.json(trailData);
    },
    next
  );
};

exports.getMileMarker = function (req, res, next) {
  var options = {
    trailName: req.params.trailName,
    mile: parseFloat(req.params.mile)
  };

  mileMarkers.findByValue(options)
  .done(
    function(marker) {
      res.json(marker);
    },
    next
  );
};

exports.getWaypointTypeaheadList = function (req, res, next) {
  var options = {
    trailName: req.params.trailName,
    text: req.params.text
  };

  waypoints.getTypeaheadList(options)
  .done(
    function(waypointNames) {
      res.json(waypointNames);
    },
    next
  );
};

exports.getWaypoint = function (req, res, next) {
  var options = {
    trailName: req.params.trailName,
    name: req.params.name
  };

  waypoints.findByName(options)
  .done(
    function(waypoint) {
      res.json(waypoint);
    },
    next
  );
};

exports.deleteWaypoint = function (req, res, next) {
  var options = {
    trailName: req.params.trailName,
    id: req.params.id
  };

  waypoints.deleteById(options)
  .done(
    function() {
      res.send();
    },
    next
  );
};

exports.getWaypoints = function (req, res, next) {
  var options = {
    trailName: req.params.trailName,
  };

  waypoints.getWaypoints(options)
  .done(
    function(waypoints) {
      res.json(waypoints);
    },
    next
  );
};

exports.importdata = function (req, res, next) {
  dataImporter.import()
  .done(
    function(marker) {
      res.json("success");
    },
    next
  );
};