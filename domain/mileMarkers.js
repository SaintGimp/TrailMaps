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
 * @param {import("./types.js").BoundingBoxOptions} options
 * @returns {Promise<import("./types.js").MileMarker[]>}
 */
export async function findByArea(options) {
  var effectiveDetailLevel = Math.min(options.detailLevel, maxDetailevel);

  const west = parseFloat(String(options.west));
  const south = parseFloat(String(options.south));
  const east = parseFloat(String(options.east));
  const north = parseFloat(String(options.north));

  const polygon = {
    type: "Polygon",
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south]
      ]
    ]
  };

  const querySpec = {
    query:
      "SELECT c.loc, c.mile FROM c WHERE c.trailName = @trailName AND c.detailLevel <= @detailLevel AND ST_WITHIN(c.loc, @polygon) ORDER BY c.mile ASC",
    parameters: [
      { name: "@trailName", value: options.trailName },
      { name: "@detailLevel", value: effectiveDetailLevel },
      { name: "@polygon", value: polygon }
    ]
  };

  const results = await dataService.query("milemarkers", querySpec);

  return results.map((item) => ({
    loc: item.loc.coordinates,
    mile: item.mile
  }));
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {number} options.mile
 * @returns {Promise<import("./types.js").MileMarker | null>}
 */
export async function findByValue(options) {
  const querySpec = {
    query:
      "SELECT TOP 1 c.loc, c.mile FROM c WHERE c.trailName = @trailName AND c.detailLevel = @detailLevel AND c.mile = @mile",
    parameters: [
      { name: "@trailName", value: options.trailName },
      { name: "@detailLevel", value: maxDetailevel },
      { name: "@mile", value: options.mile }
    ]
  };

  const results = await dataService.query("milemarkers", querySpec);

  if (results.length === 0) return null;

  return {
    loc: results[0].loc.coordinates,
    mile: results[0].mile
  };
}
