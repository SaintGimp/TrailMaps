var dataService;

module.exports = function(dataServiceToUse)
{
  dataService = dataServiceToUse;
  return exports;
};

// TODO: pull this from the data store
var maxDetailevel = 14;

function makeCollectionName(trailName, detailLevel) {
  return trailName + "_milemarkers" + detailLevel;
}

exports.findByArea = async function(options) {
  var effectiveDetailLevel = Math.min(options.detailLevel, maxDetailevel);
  var collectionName = makeCollectionName(options.trailName, effectiveDetailLevel);
  var searchTerms = {
    "loc": {
      "$within": {
        "$box": [[parseFloat(options.west), parseFloat(options.south)], [parseFloat(options.east), parseFloat(options.north)]]
      }
    }
  };
  var projection = { _id: 0, loc: 1, mile: 1 };
  var sortOrder = { _id: 1 };

  return await dataService.findArray(collectionName, searchTerms, projection, sortOrder);
};

exports.findByValue = async function(options) {
  var collectionName = makeCollectionName(options.trailName, maxDetailevel);
  var searchTerms = { mile: options.mile };
  var projection = { _id: 0, loc: 1, mile: 1 };
  var sortOrder = { _id: 1 };

  return await dataService.findOne(collectionName, searchTerms, projection, sortOrder);
};
