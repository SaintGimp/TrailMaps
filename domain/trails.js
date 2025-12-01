import * as tracksModule from "./tracks.js";
import * as mileMarkersModule from "./mileMarkers.js";

/** @type {import("./dataService.js")} */
let dataService;
/** @type {typeof tracksModule} */
let tracks;
/** @type {typeof mileMarkersModule} */
let mileMarkers;

/**
 * @param {import("./dataService.js")} dataServiceToUse
 */
export function initialize(dataServiceToUse) {
  dataService = dataServiceToUse;
  tracksModule.initialize(dataService);
  tracks = tracksModule;
  mileMarkersModule.initialize(dataService);
  mileMarkers = mileMarkersModule;
}

/**
 * @param {import("./types.js").BoundingBoxOptions} options
 * @param {any} [_log]
 * @returns {Promise<import("./types.js").TrailData>}
 */
export async function findByArea(options, _log) {
  var tracksPromise = tracks.findByArea(options);
  var mileMarkersPromise = mileMarkers.findByArea(options);
  var trailData = await Promise.all([tracksPromise, mileMarkersPromise]);

  return {
    track: trailData[0],
    mileMarkers: trailData[1]
  };
}
