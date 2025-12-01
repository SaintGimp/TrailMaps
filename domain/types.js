/**
 * @typedef {Object} Coordinate
 * @property {number} lat
 * @property {number} lng
 */

/**
 * @typedef {number[]} GeoJSONPoint
 */

/**
 * @typedef {Object} Waypoint
 * @property {import("mongodb").ObjectId} [_id]
 * @property {string} name
 * @property {string} [halfmileDescription]
 * @property {GeoJSONPoint} loc
 * @property {number} [seq]
 * @property {string} [trailName]
 */

/**
 * @typedef {Object} TrackPoint
 * @property {GeoJSONPoint} loc
 * @property {number} [seq]
 */

/**
 * @typedef {Object} MileMarker
 * @property {GeoJSONPoint} loc
 * @property {number} mile
 */

/**
 * @typedef {Object} TrailData
 * @property {TrackPoint[]} track
 * @property {MileMarker[]} mileMarkers
 */

/**
 * @typedef {Object} BoundingBoxOptions
 * @property {string} trailName
 * @property {number} detailLevel
 * @property {number} north
 * @property {number} south
 * @property {number} east
 * @property {number} west
 */

export {};
