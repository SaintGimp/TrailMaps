var Q = require('q');
var _ = require('underscore');
var ObjectId = require('mongodb').ObjectID;

var dataService;

module.exports = function(dataServiceToUse)
{
  dataService = dataServiceToUse;
  return exports;
};

function makeCollectionName(trailName) {
  return trailName + "_waypoints";
}

exports.getWaypoints = function(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { };
  var projection = { _id: 1, name: 1, loc: 1, seq: 1 };
  var sortOrder = { seq: 1 };

  return dataService.findArray(collectionName, searchTerms, projection, sortOrder);
};

exports.findByName = function(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { name: new RegExp("^" + options.name, "i") };
  var projection = { _id: 0, name: 1, loc: 1 };

  return dataService.findOne(collectionName, searchTerms, projection);
};

exports.getTypeaheadList = function(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { name: new RegExp(options.text, "i") };
  var projection = { name: 1 };
  var sortOrder = { name: 1 };

  return dataService.findArray(collectionName, searchTerms, projection, sortOrder).
  then(function(matches) {
    return matches.map(function (waypoint) {
      return waypoint.name;
    });
  });
};

exports.updateById = function(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { _id: new ObjectId(options.id) };
  var updateOperation = { $set: { name: options.name } };

  return dataService.update(collectionName, searchTerms, updateOperation)
  .then(function(result) {
    return result[0] === 1;
  });
};

exports.deleteById = function(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { _id: new ObjectId(options.id) };

  return dataService.remove(collectionName, searchTerms);
};
