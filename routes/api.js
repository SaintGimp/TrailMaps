import dataService from "../domain/dataService.js";
import * as mileMarkersModule from "../domain/mileMarkers.js";
import * as waypointsModule from "../domain/waypoints.js";
import * as trailsModule from "../domain/trails.js";
import dataImporter from "../data/dataimporter.js";

// Initialize domain modules with dataService
mileMarkersModule.initialize(dataService);
const mileMarkers = mileMarkersModule;

waypointsModule.initialize(dataService);
const waypoints = waypointsModule;

trailsModule.initialize(dataService);
const trails = trailsModule;

function safeHandler(handler) {
  return function (req, res) {
    handler(req, res).catch((error) => {
      console.log(error);
      res.status(500).send(error.message);
    });
  };
}

export default function (app) {
  app.get("/api/config", getConfig);
  app.get("/api/trails/:trailName/milemarkers/:mile", safeHandler(getMileMarker));
  app.get("/api/trails/:trailName/waypoints/typeahead/:text", safeHandler(getWaypointTypeaheadList));
  app.get("/api/trails/:trailName/waypoints", safeHandler(getWaypoints));
  app.post("/api/trails/:trailName/waypoints", safeHandler(createWaypoint));
  app.put("/api/trails/:trailName/waypoints/:id", safeHandler(updateWaypoint));
  app.delete("/api/trails/:trailName/waypoints/:id", safeHandler(deleteWaypoint));
  app.get("/api/trails/:trailName", safeHandler(getTrailData));
  app.post("/api/admin/importdata", safeHandler(importdata));
}

export function getConfig(req, res) {
  res.json({
    azureMapsSubscriptionKey: process.env.AZURE_MAPS_SUBSCRIPTION_KEY || ""
  });
}

export async function getTrailData(req, res) {
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
}

export async function getMileMarker(req, res) {
  var options = {
    trailName: req.params.trailName,
    mile: parseFloat(req.params.mile)
  };

  var marker = await mileMarkers.findByValue(options);
  res.json(marker);
}

export async function getWaypointTypeaheadList(req, res) {
  var options = {
    trailName: req.params.trailName,
    text: req.params.text
  };

  var waypointNames = await waypoints.getTypeaheadList(options);
  res.json(waypointNames);
}

export async function getWaypoints(req, res) {
  var options = {
    trailName: req.params.trailName,
    name: req.query.name
  };

  if (options.name) {
    var waypoint = await waypoints.findByName(options);
    if (waypoint) {
      res.json(Array.of(waypoint));
    } else {
      res.json([]);
    }
  } else {
    var waypointList = await waypoints.getWaypoints(options);
    res.json(waypointList);
  }
}

export async function createWaypoint(req, res) {
  var options = {
    trailName: req.params.trailName,
    waypoint: req.body
  };

  var success = await waypoints.create(options);
  if (!success) {
    res.status(500);
  } else {
    res.status(201);
  }
  res.send();
}

export async function updateWaypoint(req, res) {
  var options = {
    trailName: req.params.trailName,
    id: req.params.id,
    name: req.body.name
  };

  var success = await waypoints.updateById(options);
  if (!success) {
    res.status(404);
  }
  res.send();
}

export async function deleteWaypoint(req, res) {
  var options = {
    trailName: req.params.trailName,
    id: req.params.id
  };

  var success = await waypoints.deleteById(options);
  if (!success) {
    res.status(404);
  }
  res.send();
}

export async function importdata(req, res) {
  try {
    res.connection.setTimeout(0);
    await dataImporter.import();
    res.json("success");
  } catch (err) {
    console.log(err);
    res.status(500);
    res.send();
  }
}
