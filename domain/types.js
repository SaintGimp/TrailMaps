/**
 * @typedef {Object} Coordinate
 * @property {number} lat
 * @property {number} lng
 */

/**
 * @typedef {number[]} LegacyPoint
 */

/**
 * @typedef {Object} GeoJSONPoint
 * @property {string} type
 * @property {number[]} coordinates
 */

/**
 * @typedef {Object} Waypoint
 * @property {string} [_id]
 * @property {string} name
 * @property {string} [halfmileDescription]
 * @property {LegacyPoint} loc
 * @property {number} [seq]
 * @property {string} [trailName]
 */

/**
 * @typedef {Object} TrackPoint
 * @property {LegacyPoint} loc
 * @property {number} [seq]
 */

/**
 * @typedef {Object} MileMarker
 * @property {LegacyPoint} loc
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
