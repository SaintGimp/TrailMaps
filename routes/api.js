/*
 * Serve JSON to our AngularJS client
 */

var dataService = require("../domain/dataService.js");
var tracks = require("../domain/tracks.js")(dataService);
var waypoints = require("../domain/waypoints.js")(dataService);

module.exports = function(app) {
  app.get('/api/trails/:name', exports.trails);
};

exports.trails = function (req, res) {
  var options = {
    name: req.params.name,
    north: req.query.north,
    south: req.query.south,
    east: req.query.east,
    west: req.query.west,
    detailLevel: req.query.detail
  };

  tracks.getData(options, function(err, trackData) {
    if (err) { throw new Error(err); }
    waypoints.getData(options, function(err, waypointData) {
      if (err) { throw new Error(err); }
      res.json({
        track: trackData,
        waypoints: waypointData
      });
    });
  });
};