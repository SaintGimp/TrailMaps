var dataService = require("../domain/dataService.js");
var mileMarkers = require("../domain/mileMarkers.js")(dataService);
var waypoints = require("../domain/waypoints.js")(dataService);
var trails = require("../domain/trails.js")(dataService);
var dataImporter = require("../data/dataimporter.js");

module.exports = function(app) {
  app.get("/api/trails/:trailName/milemarkers/:mile", exports.getMileMarker);
  app.get("/api/trails/:trailName/waypoints/typeahead/:text", exports.getWaypointTypeaheadList);
  app.get("/api/trails/:trailName/waypoints/:name", exports.getWaypoint);
  app.put("/api/trails/:trailName/waypoints/:id", exports.updateWaypoint);
  app.delete("/api/trails/:trailName/waypoints/:id", exports.deleteWaypoint);
  app.get("/api/trails/:trailName/waypoints", exports.getWaypoints);
  app.get("/api/trails/:trailName", exports.getTrailData);
  app.post("/api/admin/importdata", exports.importdata);
};

exports.getTrailData = async function (req, res) {
  var options = {
    trailName: req.params.trailName,
    north: req.query.north,
    south: req.query.south,
    east: req.query.east,
    west: req.query.west,
    detailLevel: req.query.detail
  };

  var trailData = await trails.findByArea(options, res.locals.log);
  res.json(trailData);
};

exports.getMileMarker = async function (req, res) {
  var options = {
    trailName: req.params.trailName,
    mile: parseFloat(req.params.mile)
  };

  var marker = await mileMarkers.findByValue(options);
  res.json(marker);
};

exports.getWaypointTypeaheadList = async function (req, res) {
  var options = {
    trailName: req.params.trailName,
    text: req.params.text
  };

  var waypointNames = await waypoints.getTypeaheadList(options);
  res.json(waypointNames);
};

exports.getWaypoint = async function (req, res) {
  var options = {
    trailName: req.params.trailName,
    name: req.params.name
  };

  var waypoint = await waypoints.findByName(options);
  res.json(waypoint);
};

exports.updateWaypoint = async function (req, res) {
  var options = {
    trailName: req.params.trailName,
    id: req.params.id,
    name: req.body.name
  };

  var success = await waypoints.updateById(options);
  if (!success)
  {
    res.status(404);
  }
  res.send();
};

exports.deleteWaypoint = async function (req, res) {
  var options = {
    trailName: req.params.trailName,
    id: req.params.id
  };

  await waypoints.deleteById(options);
  res.send();
};

exports.getWaypoints = async function (req, res) {
  var options = {
    trailName: req.params.trailName,
  };

  var waypointList = await waypoints.getWaypoints(options);
  res.json(waypointList);
};

exports.importdata = async function (req, res) {
  try {
    res.connection.setTimeout(0);
    await dataImporter.import();
    res.json("success");
  }
  catch (err) {
    console.log(err);
    res.status(500);
    res.send();
  }
};