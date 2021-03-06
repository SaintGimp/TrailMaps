var dataService = require("../domain/dataService.js");
var mileMarkers = require("../domain/mileMarkers.js")(dataService);
var waypoints = require("../domain/waypoints.js")(dataService);
var trails = require("../domain/trails.js")(dataService);
var dataImporter = require("../data/dataimporter.js");

function safeHandler(handler) {
  return function(req, res) {
    handler(req, res).catch(error => {
      console.log(error);
      res.status(500).send(error.message);
    });
  };
}

module.exports = function(app) {
  app.get("/api/trails/:trailName/milemarkers/:mile", safeHandler(exports.getMileMarker));
  app.get("/api/trails/:trailName/waypoints/typeahead/:text", safeHandler(exports.getWaypointTypeaheadList));
  app.get("/api/trails/:trailName/waypoints", safeHandler(exports.getWaypoints));
  app.post("/api/trails/:trailName/waypoints", safeHandler(exports.createWaypoint));
  app.put("/api/trails/:trailName/waypoints/:id", safeHandler(exports.updateWaypoint));
  app.delete("/api/trails/:trailName/waypoints/:id", safeHandler(exports.deleteWaypoint));
  app.get("/api/trails/:trailName", safeHandler(exports.getTrailData));
  app.post("/api/admin/importdata", safeHandler(exports.importdata));
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

exports.getWaypoints = async function (req, res) {
  var options = {
    trailName: req.params.trailName,
    name: req.query.name
  };

  if (options.name) {
    var waypoint = await waypoints.findByName(options);
    if (waypoint) {
      res.json(Array.of(waypoint));
    }
    else {
      res.json([]);
    }
  }
  else {
    var waypointList = await waypoints.getWaypoints(options);
    res.json(waypointList);  
  }
};

exports.createWaypoint = async function (req, res) {
  var options = {
    trailName: req.params.trailName,
    waypoint: req.body
  };

  var success = await waypoints.create(options);
  if (!success)
  {
    res.status(500);
  }
  else {
    res.status(201);
  }
  res.send();
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

  var success = await waypoints.deleteById(options);
  if (!success)
  {
    res.status(404);
  }
  res.send();
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