/** @typedef {import("./types.js").Waypoint} Waypoint */

/** @type {import("./dataService.js")} */
let dataService;

/**
 * @param {import("./dataService.js")} dataServiceToUse
 */
export function initialize(dataServiceToUse) {
  dataService = dataServiceToUse;
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @returns {Promise<Waypoint[]>}
 */
export async function getWaypoints(options) {
  const querySpec = {
    query: "SELECT * FROM c WHERE c.trailName = @trailName ORDER BY c.seq ASC",
    parameters: [{ name: "@trailName", value: options.trailName }]
  };
  const results = await dataService.query("waypoints", querySpec);
  return results.map((item) => ({
    ...item,
    loc: item.loc.coordinates,
    _id: item.id // Map Cosmos id to _id for compatibility
  }));
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {string} options.name
 * @returns {Promise<Waypoint | null>}
 */
export async function findByName(options) {
  const querySpec = {
    query: "SELECT * FROM c WHERE c.trailName = @trailName AND STARTSWITH(c.name, @name, true)",
    parameters: [
      { name: "@trailName", value: options.trailName },
      { name: "@name", value: options.name }
    ]
  };
  const results = await dataService.query("waypoints", querySpec);
  if (results.length === 0) return null;
  const item = results[0];
  return {
    ...item,
    loc: item.loc.coordinates,
    _id: item.id
  };
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {string} options.text
 * @returns {Promise<string[]>}
 */
export async function getTypeaheadList(options) {
  const querySpec = {
    query: "SELECT c.name FROM c WHERE c.trailName = @trailName AND CONTAINS(c.name, @text, true) ORDER BY c.name ASC",
    parameters: [
      { name: "@trailName", value: options.trailName },
      { name: "@text", value: options.text }
    ]
  };
  const results = await dataService.query("waypoints", querySpec);
  return results.map((item) => item.name);
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {string} options.id
 * @param {string} options.name
 * @returns {Promise<boolean>}
 */
export async function updateById(options) {
  const querySpec = {
    query: "SELECT * FROM c WHERE c.id = @id AND c.trailName = @trailName",
    parameters: [
      { name: "@id", value: options.id },
      { name: "@trailName", value: options.trailName }
    ]
  };
  const results = await dataService.query("waypoints", querySpec);
  if (results.length === 0) return false;

  const item = results[0];
  item.name = options.name;

  await dataService.replace("waypoints", options.id, item);
  return true;
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {string} options.id
 * @returns {Promise<{ acknowledged: boolean, deletedCount: number }>}
 */
export async function deleteById(options) {
  await dataService.deleteItem("waypoints", options.id, options.trailName);
  return { acknowledged: true, deletedCount: 1 };
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {Waypoint} options.waypoint
 * @returns {Promise<boolean>}
 */
export async function create(options) {
  const waypoint = options.waypoint;
  // waypoint.loc is [lon, lat]
  const geoJsonLoc = {
    type: "Point",
    coordinates: waypoint.loc
  };

  const seq = await getSequenceNumber(geoJsonLoc);

  const item = {
    ...waypoint,
    loc: geoJsonLoc,
    seq: seq,
    trailName: options.trailName
  };

  const resource = await dataService.create("waypoints", item);
  return !!(resource && resource.id != null);
}

/**
 * @param {import("./types.js").GeoJSONPoint} location
 */
async function getSequenceNumber(location) {
  // location is GeoJSON Point
  const querySpec = {
    query:
      "SELECT TOP 10 c.seq, ST_DISTANCE(c.loc, @point) as dist FROM c WHERE c.trailName = 'pct' AND c.detailLevel = 16 AND ST_DISTANCE(c.loc, @point) < 1000",
    parameters: [{ name: "@point", value: location }]
  };

  const results = await dataService.query("tracks", querySpec);
  if (results.length === 0) return 0;

  results.sort((a, b) => a.dist - b.dist);
  return results[0].seq;
}
