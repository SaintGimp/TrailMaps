import * as dataService from "../domain/dataService.js";
import * as mileMarkersModule from "../domain/mileMarkers.js";
import * as waypointsModule from "../domain/waypoints.js";
import * as trailsModule from "../domain/trails.js";
import dataImporter from "../data/dataimporter.js";
import {
  validateTrailName,
  validateMile,
  validateText,
  validateId,
  validateCoordinates,
  validateDetail,
  validateWaypointBody,
  validateWaypointUpdateBody,
  validateWaypointNameQuery,
  handleValidationErrors
} from "../middleware/validation.js";
import { apiLimiter, writeLimiter, adminLimiter } from "../middleware/rateLimiter.js";

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
  app.get("/api/config", apiLimiter, getConfig);
  app.get(
    "/api/trails/:trailName/milemarkers/:mile",
    apiLimiter,
    validateTrailName,
    validateMile,
    handleValidationErrors,
    safeHandler(getMileMarker)
  );
  app.get(
    "/api/trails/:trailName/waypoints/typeahead/:text",
    apiLimiter,
    validateTrailName,
    validateText,
    handleValidationErrors,
    safeHandler(getWaypointTypeaheadList)
  );
  app.get(
    "/api/trails/:trailName/waypoints",
    apiLimiter,
    validateTrailName,
    validateWaypointNameQuery,
    handleValidationErrors,
    safeHandler(getWaypoints)
  );
  app.post(
    "/api/trails/:trailName/waypoints",
    writeLimiter,
    validateTrailName,
    validateWaypointBody,
    handleValidationErrors,
    safeHandler(createWaypoint)
  );
  app.put(
    "/api/trails/:trailName/waypoints/:id",
    writeLimiter,
    validateTrailName,
    validateId,
    validateWaypointUpdateBody,
    handleValidationErrors,
    safeHandler(updateWaypoint)
  );
  app.delete(
    "/api/trails/:trailName/waypoints/:id",
    writeLimiter,
    validateTrailName,
    validateId,
    handleValidationErrors,
    safeHandler(deleteWaypoint)
  );
  app.get(
    "/api/trails/:trailName",
    apiLimiter,
    validateTrailName,
    validateCoordinates,
    validateDetail,
    handleValidationErrors,
    safeHandler(getTrailData)
  );
  app.post("/api/admin/importdata", adminLimiter, safeHandler(importdata));
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export function getConfig(req, res) {
  res.json({
    azureMapsSubscriptionKey: process.env.AZURE_MAPS_SUBSCRIPTION_KEY || "",
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ""
  });
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function getTrailData(req, res) {
  var options = {
    trailName: req.params.trailName,
    north: parseFloat(String(req.query.north)),
    south: parseFloat(String(req.query.south)),
    east: parseFloat(String(req.query.east)),
    west: parseFloat(String(req.query.west)),
    detailLevel: parseInt(String(req.query.detail))
  };

  // @ts-ignore
  var trailData = await trails.findByArea(options, res.locals.log);
  res.json(trailData);
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function getMileMarker(req, res) {
  var options = {
    trailName: req.params.trailName,
    mile: parseFloat(req.params.mile)
  };

  var marker = await mileMarkers.findByValue(options);
  res.json(marker);
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function getWaypointTypeaheadList(req, res) {
  var options = {
    trailName: req.params.trailName,
    text: req.params.text
  };

  var waypointNames = await waypoints.getTypeaheadList(options);
  res.json(waypointNames);
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function getWaypoints(req, res) {
  var options = {
    trailName: req.params.trailName,
    name: String(req.query.name)
  };

  if (req.query.name) {
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

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
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

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
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

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
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

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export async function importdata(req, res) {
  try {
    res.socket.setTimeout(0);
    await dataImporter.import();
    res.json("success");
  } catch (err) {
    console.log(err);
    res.status(500);
    res.send();
  }
}
