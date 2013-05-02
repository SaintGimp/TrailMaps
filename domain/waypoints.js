var Q = require('q');

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
