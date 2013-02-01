/*
 * Serve JSON to our AngularJS client
 */

var dataService = require("../domain/dataService.js");
var tracks = require("../domain/tracks.js")(dataService);
var mileMarkers = require("../domain/mileMarkers.js")(dataService);
var dataImporter = require("../data/dataimporter.js");

module.exports = function(app) {
  app.get('/api/trails/:trailName/milemarkers/:mile', exports.getMileMarker);
  app.get('/api/trails/:trailName', exports.getTrailData);
  app.post('/api/admin/importdata', exports.importdata);
};

exports.getTrailData = function (req, res) {
  var options = {
    trailName: req.params.trailName,
    north: req.query.north,
    south: req.query.south,
    east: req.query.east,
    west: req.query.west,
    detailLevel: req.query.detail
  };

  tracks.findByArea(options, function(err, trackData) {
    if (err) { throw new Error(err); }
    mileMarkers.findByArea(options, function(err, markerData) {
      if (err) { throw new Error(err); }
      res.json({
        track: trackData,
        mileMarkers: markerData
      });
    });
  });
};

exports.getMileMarker = function (req, res) {
  var options = {
    trailName: req.params.trailName,
    mile: parseFloat(req.params.mile)
  };
  mileMarkers.findByValue(options, function(err, waypoint) {
    if (err) { throw new Error(err); }
    res.json(waypoint);
  });
};

exports.importdata = function (req, res) {
  dataImporter.import(function(err) {
    if (err) { throw new Error(err); }
    res.json("success");
  });
};