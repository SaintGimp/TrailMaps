import { ObjectId } from "mongodb";

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
 * @param {string} trailName
 */
function makeCollectionName(trailName) {
  return trailName + "_waypoints";
}

/**
 * @param {string} string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @returns {Promise<Waypoint[]>}
 */
export async function getWaypoints(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = {};
  var projection = { _id: 1, name: 1, halfmileDescription: 1, loc: 1, seq: 1 };
  var sortOrder = { seq: 1 };

  // @ts-ignore
  return await dataService.findArray(collectionName, searchTerms, projection, sortOrder);
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {string} options.name
 * @returns {Promise<Waypoint | null>}
 */
export async function findByName(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { name: new RegExp("^" + escapeRegExp(options.name), "i") };
  var projection = { _id: 0, name: 1, loc: 1 };

  // @ts-ignore
  return await dataService.findOne(collectionName, searchTerms, projection);
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {string} options.text
 * @returns {Promise<string[]>}
 */
export async function getTypeaheadList(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { name: new RegExp(options.text, "i") };
  var projection = { name: 1 };
  /** @type {import("mongodb").Sort} */
  var sortOrder = { name: 1 };

  var matches = await dataService.findArray(collectionName, searchTerms, projection, sortOrder);
  return matches.map(function (waypoint) {
    return waypoint.name;
  });
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {string} options.id
 * @param {string} options.name
 * @returns {Promise<boolean>}
 */
export async function updateById(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { _id: new ObjectId(options.id) };
  var updateOperation = { $set: { name: options.name } };

  var commandResult = await dataService.update(collectionName, searchTerms, updateOperation);
  return commandResult.acknowledged && commandResult.matchedCount > 0;
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {string} options.id
 * @returns {Promise<import("mongodb").DeleteResult>}
 */
export async function deleteById(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { _id: new ObjectId(options.id) };

  return await dataService.remove(collectionName, searchTerms);
}

/**
 * @param {Object} options
 * @param {string} options.trailName
 * @param {Waypoint} options.waypoint
 * @returns {Promise<boolean>}
 */
export async function create(options) {
  var collectionName = makeCollectionName(options.trailName);
  var waypoint = options.waypoint;
  waypoint.seq = await getSequenceNumber(waypoint.loc);

  var commandResult = await dataService.insert(collectionName, waypoint);
  return commandResult.acknowledged && commandResult.insertedId != null;
}

/**
 * @param {import("./types.js").GeoJSONPoint} location
 */
async function getSequenceNumber(location) {
  var trackPoint = await dataService.findOne("pct_track16", { loc: { $near: location } }, { seq: 1 });
  // @ts-ignore
  return trackPoint.seq;
}
