var ObjectId = require("mongodb").ObjectID;

var dataService;

module.exports = function(dataServiceToUse)
{
  dataService = dataServiceToUse;
  return exports;
};

function makeCollectionName(trailName) {
  return trailName + "_waypoints";
}

exports.getWaypoints = async function(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { };
  var projection = { _id: 1, name: 1, loc: 1, seq: 1 };
  var sortOrder = { seq: 1 };

  return await dataService.findArray(collectionName, searchTerms, projection, sortOrder);
};

exports.findByName = async function(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { name: new RegExp("^" + options.name, "i") };
  var projection = { _id: 0, name: 1, loc: 1 };

  return await dataService.findOne(collectionName, searchTerms, projection);
};

exports.getTypeaheadList = async function(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { name: new RegExp(options.text, "i") };
  var projection = { name: 1 };
  var sortOrder = { name: 1 };

  var matches = await dataService.findArray(collectionName, searchTerms, projection, sortOrder);
  return matches.map(function (waypoint) {
    return waypoint.name;
  });
};

exports.updateById = async function(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { _id: new ObjectId(options.id) };
  var updateOperation = { $set: { name: options.name } };

  var result = await dataService.update(collectionName, searchTerms, updateOperation);
  return result[0] === 1;
};

exports.deleteById = async function(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { _id: new ObjectId(options.id) };

  return await dataService.remove(collectionName, searchTerms);
};
