import fs from "fs";
import { promisify } from "util";
import xml2js from "xml2js";
import * as dataService from "../domain/dataService.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var parser = new xml2js.Parser();
var readFileAsync = promisify(fs.readFile);
var parseStringAsync = promisify(parser.parseString.bind(parser));

var fileNames = [
  "data/pct/ca_state_gps/CA_Sec_A_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_B_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_C_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_D_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_E_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_F_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_G_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_H_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_I_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_J_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_K_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_L_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_M_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_N_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_O_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_P_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_Q_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_R_waypoints.gpx",

  "data/pct/or_state_gps/OR_Sec_B_waypoints.gpx",
  "data/pct/or_state_gps/OR_Sec_C_waypoints.gpx",
  "data/pct/or_state_gps/OR_Sec_D_waypoints.gpx",
  "data/pct/or_state_gps/OR_Sec_E_waypoints.gpx",
  "data/pct/or_state_gps/OR_Sec_F_waypoints.gpx",
  "data/pct/or_state_gps/OR_Sec_G_waypoints.gpx",

  "data/pct/wa_state_gps/WA_Sec_H_waypoints.gpx",
  "data/pct/wa_state_gps/WA_Sec_I_waypoints.gpx",
  "data/pct/wa_state_gps/WA_Sec_J_waypoints.gpx",
  "data/pct/wa_state_gps/WA_Sec_K_waypoints.gpx",
  "data/pct/wa_state_gps/WA_Sec_L_waypoints.gpx"
];

function readFile(fileName) {
  console.log("Reading " + fileName);
  return readFileAsync(__dirname + "/../" + fileName, "utf8");
}

async function parseData(waypointXml) {
  console.log("Parsing data");

  var waypointJson = await parseStringAsync(waypointXml);

  console.log("Converting mile markers");
  var markerJson = waypointJson.gpx.wpt.filter(function (waypoint) {
    return waypoint.name[0].match(/^(?:\d{4}|\d{4}-\d)$/);
  });
  var newMarkers = markerJson.map(function (marker) {
    var name = marker.name[0].replace("-", ".");
    return {
      loc: {
        type: "Point",
        coordinates: [parseFloat(marker.$.lon), parseFloat(marker.$.lat)]
      },
      mile: parseFloat(name)
    };
  });

  return newMarkers;
}

async function loadFile(fileName) {
  console.log("Adding mile marker data from " + fileName);

  var waypointXml = await readFile(fileName);
  var markers = await parseData(waypointXml);
  return markers;
}

async function loadMileMarkers() {
  console.log("Loading mile marker files");
  var mileMarkers = [];

  var loadingPromises = fileNames.map(function (fileName) {
    return loadFile(fileName);
  });
  var fileContentSet = await Promise.all(loadingPromises);

  fileContentSet.forEach(function (fileContent) {
    mileMarkers.push(...fileContent);
  });

  // Get unique markers by mile value
  var seenMiles = new Set();
  var uniqueMarkers = mileMarkers.filter(function (marker) {
    if (seenMiles.has(marker.mile)) {
      return false;
    }
    seenMiles.add(marker.mile);
    return true;
  });

  return uniqueMarkers;
}

function getDetailLevel(index) {
  if (index === 0) {
    return 1;
  }
  var zeros = 0;
  while ((index & 1) === 0) {
    index >>= 1;
    zeros++;
  }
  return Math.max(1, 14 - zeros);
}

function buildMileMarkerPoints(mileMarkers) {
  console.log("Building mile marker points");

  var points = mileMarkers.map(function (m, i) {
    return {
      trailName: "pct",
      // The last mile marker is given the lowest detail level of 1 so it's always visible
      detailLevel: i === mileMarkers.length - 1 ? 1 : getDetailLevel(i),
      mile: m.mile,
      loc: m.loc
    };
  });

  return points;
}

async function saveMileMarkerPoints(points) {
  console.log("Saving " + points.length + " mile marker points");
  for (const item of points) {
    await dataService.create("milemarkers", item);
  }
}

export async function importMileMarkers() {
  console.log("Importing mile markers");

  var mileMarkers = await loadMileMarkers();
  var points = buildMileMarkerPoints(mileMarkers);
  await saveMileMarkerPoints(points);

  console.log("Finished importing mile markers");
}
