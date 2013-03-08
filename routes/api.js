var dataService = require("../domain/dataService.js");
var mileMarkers = require("../domain/mileMarkers.js")(dataService);
var trails = require("../domain/trails.js")(dataService);
var dataImporter = require("../data/dataimporter.js");

module.exports = function(app) {
  app.get('/api/trails/:trailName/milemarkers/:mile', exports.getMileMarker);
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

  trails.findByArea(options, function(err, trailData) {
    if (err) { next(err); }
    res.json(trailData);
  });
};

exports.getMileMarker = function (req, res, next) {
  var options = {
    trailName: req.params.trailName,
    mile: parseFloat(req.params.mile)
  };
  mileMarkers.findByValue(options, function(err, waypoint) {
    if (err) { next(err); }
    res.json(waypoint);
  });
};

exports.importdata = function (req, res, next) {
  dataImporter.import(function(err) {
    if (err) { next(err); }
    res.json("success");
  });
};