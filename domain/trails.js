var Q = require('Q');

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

exports.findByArea = function(options) {
  var getTracks = tracks.findByArea(options);
  var getMileMarkers = mileMarkers.findByArea(options);

  return Q.spread([getTracks, getMileMarkers], function(trackData, markerData) {
    return {
        track: trackData,
        mileMarkers: markerData
    };
  });
};
