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
      "SELECT c.loc FROM c WHERE c.trailName = @trailName AND c.detailLevel <= @detailLevel AND ST_WITHIN(c.loc, @polygon) ORDER BY c.seq ASC",
    parameters: [
      { name: "@trailName", value: options.trailName },
      { name: "@detailLevel", value: effectiveDetailLevel },
      { name: "@polygon", value: polygon }
    ]
  };

  const results = await dataService.query("tracks", querySpec);

  return results.map((item) => ({
    loc: item.loc.coordinates
  }));
}
