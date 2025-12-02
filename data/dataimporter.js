import * as trackImporter from "./trackimporter.js";
import * as mileMarkerImporter from "./milemarkerimporter.js";
import * as waypointImporter from "./waypointimporter.js";
import * as dataService from "../domain/dataService.js";

export async function importData() {
  console.log("Importing trail data");

  await dataService.connect();

  await trackImporter.importTracks();
  await mileMarkerImporter.importMileMarkers();
  await waypointImporter.importWaypoints();
}

export default {
  import: importData
};
