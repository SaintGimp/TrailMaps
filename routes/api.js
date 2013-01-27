/*
 * Serve JSON to our AngularJS client
 */

var dataService = require("../domain/dataService.js");
var tracks = require("../domain/tracks.js")(dataService);
var waypoints = require("../domain/waypoints.js")(dataService);

module.exports = function(app) {
  app.get('/api/trails/:trailName/milemarkers/:mileMarkerName', exports.mileMarkers);
  app.get('/api/trails/:trailName', exports.trails);
};

exports.trails = function (req, res) {
  var options = {
    name: req.params.trailName,
    north: req.query.north,
    south: req.query.south,
    east: req.query.east,
    west: req.query.west,
    detailLevel: req.query.detail
  };

  tracks.findByArea(options, function(err, trackData) {
    if (err) { throw new Error(err); }
    waypoints.findByArea(options, function(err, waypointData) {
      if (err) { throw new Error(err); }
      res.json({
        track: trackData,
        waypoints: waypointData
      });
    });
  });
};

exports.mileMarkers = function (req, res) {
  var options = {
    trailName: req.params.trailName,
    waypointName: req.params.mileMarkerName
  };
  waypoints.findByExactName(options, function(err, waypoint) {
    if (err) { throw new Error(err); }
    res.json(waypoint);
  });
};