/** @type {import("./dataService.js")} */
let dataService;

/**
 * @param {import("./dataService.js")} dataServiceToUse
 */
export function initialize(dataServiceToUse) {
  dataService = dataServiceToUse;
}

// TODO: pull this from the data store
var maxDetailevel = 16;

/**
 * @param {import("./types.js").BoundingBoxOptions} options
 * @returns {Promise<import("./types.js").TrackPoint[]>}
 */
export async function findByArea(options) {
  var effectiveDetailLevel = Math.min(options.detailLevel, maxDetailevel);
  var collectionName = options.trailName + "_track" + effectiveDetailLevel;
  var searchTerms = {
    loc: {
      $within: {
        $box: [
          [parseFloat(String(options.west)), parseFloat(String(options.south))],
          [parseFloat(String(options.east)), parseFloat(String(options.north))]
        ]
      }
    }
  };
  var projection = { _id: 0, loc: 1 };
  var sortOrder = { seq: 1 };

  // @ts-ignore
  return await dataService.findArray(collectionName, searchTerms, projection, sortOrder);
}
