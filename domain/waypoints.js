var ObjectId = require("mongodb").ObjectId;

var dataService;

module.exports = function (dataServiceToUse) {
  dataService = dataServiceToUse;
  return exports;
};

function makeCollectionName(trailName) {
  return trailName + "_waypoints";
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
exports.getWaypoints = async function (options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = {};
  var projection = { _id: 1, name: 1, halfmileDescription: 1, loc: 1, seq: 1 };
  var sortOrder = { seq: 1 };

  return await dataService.findArray(collectionName, searchTerms, projection, sortOrder);
};

exports.findByName = async function (options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { name: new RegExp("^" + escapeRegExp(options.name), "i") };
  var projection = { _id: 0, name: 1, loc: 1 };

  return await dataService.findOne(collectionName, searchTerms, projection);
};

exports.getTypeaheadList = async function (options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { name: new RegExp(options.text, "i") };
  var projection = { name: 1 };
  var sortOrder = { name: 1 };

  var matches = await dataService.findArray(collectionName, searchTerms, projection, sortOrder);
  return matches.map(function (waypoint) {
    return waypoint.name;
  });
};

exports.updateById = async function (options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { _id: new ObjectId(options.id) };
  var updateOperation = { $set: { name: options.name } };

  var commandResult = await dataService.update(collectionName, searchTerms, updateOperation);
  return commandResult.result.ok === 1;
};

exports.deleteById = async function (options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { _id: new ObjectId(options.id) };

  return await dataService.remove(collectionName, searchTerms);
};

exports.create = async function (options) {
  var collectionName = makeCollectionName(options.trailName);
  var waypoint = options.waypoint;
  waypoint.seq = await getSequenceNumber(waypoint.loc);

  var commandResult = await dataService.insert(collectionName, waypoint);
  return commandResult.result.ok === 1;
};

async function getSequenceNumber(location) {
  var trackPoint = await dataService.findOne("pct_track16", { loc: { $near: location } }, { seq: 1 });
  return trackPoint.seq;
}
