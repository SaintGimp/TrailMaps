var dataService;

module.exports = function(dataServiceToUse)
{
  dataService = dataServiceToUse;
  return exports;
};

var maxZoomLevel = 16;

exports.getData = function(options, callback) {
  var zoom = options.zoom > maxZoomLevel ? maxZoomLevel : options.zoom;
  var collectionName = options.name + zoom;
  var searchTerms = {
   "loc": {
    "$within": {
       "$box": [[parseFloat(options.west), parseFloat(options.south)], [parseFloat(options.east), parseFloat(options.north)]]
     }
   }
  };
  var projection = { _id: 0, loc: 1 };
  var sortOrder = { _id: 1 };
  
  dataService.findArray(collectionName, searchTerms, projection, sortOrder, function (err, documents) {
    callback(err, documents);
  });
};
