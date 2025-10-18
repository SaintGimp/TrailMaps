var dataService;
var tracks;
var mileMarkers;

module.exports = function (dataServiceToUse) {
  dataService = dataServiceToUse;
  tracks = require("./tracks")(dataService);
  mileMarkers = require("./mileMarkers")(dataService);
  return exports;
};

exports.findByArea = async function (options) {
  var tracksPromise = tracks.findByArea(options);
  var mileMarkersPromise = mileMarkers.findByArea(options);
  var trailData = await Promise.all([tracksPromise, mileMarkersPromise]);

  return {
    track: trailData[0],
    mileMarkers: trailData[1]
  };
};
