/** @type {import("./dataService.js")} */
let dataService;

/**
 * @param {import("./dataService.js")} dataServiceToUse
 */
export function initialize(dataServiceToUse) {
  dataService = dataServiceToUse;
}

// TODO: pull this from the data store
var maxDetailevel = 14;

/**
 * @param {string} trailName
 * @param {number} detailLevel
 */
function makeCollectionName(trailName, detailLevel) {
  return trailName + "_milemarkers" + detailLevel;
}

/**
 * @param {import("./types.js").BoundingBoxOptions} options
 * @returns {Promise<import("./types.js").MileMarker[]>}
 */
export async function findByArea(options) {
  var effectiveDetailLevel = Math.min(options.detailLevel, maxDetailevel);
  var collectionName = makeCollectionName(options.trailName, effectiveDetailLevel);
  var searchTerms = {
    loc: {
      $geoWithin: {
        $box: [
          [parseFloat(String(options.west)), parseFloat(String(options.south))],
          [parseFloat(String(options.east)), parseFloat(String(options.north))]
        ]
      }
    }
  };
  var projection = { _id: 0, loc: 1, mile: 1 };
  var sortOrder = { _id: 1 };

  // @ts-ignore
  return await dataService.findArray(collectionName, searchTerms, projection, sortOrder);
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {number} options.mile
 * @returns {Promise<import("./types.js").MileMarker | null>}
 */
export async function findByValue(options) {
  var collectionName = makeCollectionName(options.trailName, maxDetailevel);
  var searchTerms = { mile: options.mile };
  var projection = { _id: 0, loc: 1, mile: 1 };
  var sortOrder = { _id: 1 };

  // @ts-ignore
  return await dataService.findOne(collectionName, searchTerms, projection, sortOrder);
}
