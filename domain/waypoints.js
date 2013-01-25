var dataService;

module.exports = function(dataServiceToUse)
{
  dataService = dataServiceToUse;
  return exports;
};

// TODO: pull this from the data store
var maxDetailevel = 14;

exports.getData = function(options, callback) {
  var effectiveDetailLevel = Math.min(options.detailLevel, maxDetailevel);
  var collectionName = options.name + "_waypoints" + effectiveDetailLevel;
  var searchTerms = {
   "loc": {
    "$within": {
       "$box": [[parseFloat(options.west), parseFloat(options.south)], [parseFloat(options.east), parseFloat(options.north)]]
     }
   }
  };
  var projection = { _id: 0, loc: 1, distance: 1 };
  var sortOrder = { _id: 1 };
  
  dataService.findArray(collectionName, searchTerms, projection, sortOrder, function (err, documents) {
    callback(err, documents);
  });
};
