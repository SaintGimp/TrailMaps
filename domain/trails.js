var dataService;
var tracks;
var mileMarkers;

module.exports = function(dataServiceToUse)
{
  dataService = dataServiceToUse;
  tracks = require("./tracks")(dataService);
  mileMarkers = require('./mileMarkers')(dataService);
  return exports;
};

exports.findByArea = function(options, callback) {
  // TODO: we actually want to get track and mile markers in parallel
  tracks.findByArea(options, function(err, trackData) {
    if (err) {
      callback(err, null);
    } else {
      mileMarkers.findByArea(options, function(err, markerData) {
        if (err) { callback(err, null); }
        callback(null, {
          track: trackData,
          mileMarkers: markerData
        });
      });
    }
  });
};
