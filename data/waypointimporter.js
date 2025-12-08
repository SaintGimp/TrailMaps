import fs from "fs";
import { promisify } from "util";
import * as dataService from "../domain/dataService.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var readFileAsync = promisify(fs.readFile);

var fileName = "data/pct/exported-waypoints.json";

function readFile(fileName) {
  console.log("Reading " + fileName);
  return readFileAsync(__dirname + "/../" + fileName, "utf8");
}

async function loadWaypoints() {
  console.log("Loading exported waypoint file");
  var waypoints = [];

  // Load the exported waypoints JSON file
  var fileData = await readFile(fileName);
  var fileJson = JSON.parse(fileData);

  waypoints = fileJson.map((wp) => {
    const waypoint = {
      trailName: wp.trailName || "pct",
      name: wp.name,
      loc: {
        type: "Point",
        coordinates: [wp.loc[0], wp.loc[1]]
      },
      seq: wp.seq
    };
    if (wp.halfmileName) {
      waypoint.halfmileName = wp.halfmileName;
    }
    if (wp.halfmileDescription) {
      waypoint.halfmileDescription = wp.halfmileDescription;
    }
    return waypoint;
  });

  return waypoints;
}

async function saveCollection(waypoints) {
  console.log("Saving " + waypoints.length + " waypoints");
  await dataService.createBulk("waypoints", waypoints);
}

export async function importWaypoints() {
  console.log("Importing waypoints");
  await dataService.resetContainer("waypoints");

  var waypoints = await loadWaypoints();
  await saveCollection(waypoints);

  console.log("Finished importing waypoints");
}
