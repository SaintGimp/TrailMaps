var Q = require('q');
var stopwatch = require('@songkick/promise-stopwatch');

var dataService;

module.exports = function(dataServiceToUse)
{
  dataService = dataServiceToUse;
  return exports;
};

// TODO: pull this from the data store
var maxDetailevel = 16;

exports.findByArea = function(options) {
  var effectiveDetailLevel = Math.min(options.detailLevel, maxDetailevel);
  var collectionName = options.trailName + "_track" + effectiveDetailLevel;
  var searchTerms = {
   "loc": {
    "$within": {
       "$box": [[parseFloat(options.west), parseFloat(options.south)], [parseFloat(options.east), parseFloat(options.north)]]
     }
   }
  };
  var projection = { _id: 0, loc: 1 };
  var sortOrder = { seq: 1 };

  var stopwatchPromise = stopwatch()(function() {
    return dataService.findArray(collectionName, searchTerms, projection, sortOrder);
  })()
  .then(function(response){
    console.log('Track load took ' + response.duration + 'ms');
    return response.result;
  });
  
  return new Q(stopwatchPromise);
};
