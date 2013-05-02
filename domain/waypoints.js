var Q = require('q');
var _ = require('underscore');

var dataService;

module.exports = function(dataServiceToUse)
{
  dataService = dataServiceToUse;
  return exports;
};

function makeCollectionName(trailName) {
  return trailName + "_waypoints";
}

exports.findByName = function(options) {
  var collectionName = makeCollectionName(options.trailName);
  var searchTerms = { name: new RegExp("^" + options.name, "i") };
  var projection = { _id: 0, name: 1, loc: 1 };
  var sortOrder = { _id: 1 };

  return dataService.findOne(collectionName, searchTerms, projection, sortOrder);
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
