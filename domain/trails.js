import * as tracksModule from "./tracks.js";
import * as mileMarkersModule from "./mileMarkers.js";

let dataService;
let tracks;
let mileMarkers;

export function initialize(dataServiceToUse) {
  dataService = dataServiceToUse;
  tracksModule.initialize(dataService);
  tracks = tracksModule;
  mileMarkersModule.initialize(dataService);
  mileMarkers = mileMarkersModule;
}

export async function findByArea(options) {
  var tracksPromise = tracks.findByArea(options);
  var mileMarkersPromise = mileMarkers.findByArea(options);
  var trailData = await Promise.all([tracksPromise, mileMarkersPromise]);

  return {
    track: trailData[0],
    mileMarkers: trailData[1]
  };
}
