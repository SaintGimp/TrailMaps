var Q = require('q');
var stopwatch = require('@songkick/promise-stopwatch');

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

exports.findByArea = function(options, logger) {
  var getTracks = tracks.findByArea(options);
  var getMileMarkers = mileMarkers.findByArea(options);

  var dataFunction = function() {
    return Q.spread([getTracks, getMileMarkers], function(trackData, markerData) {
      return {
          track: trackData,
          mileMarkers: markerData
      };
    });
  }

  var stopwatchPromise = stopwatch()(dataFunction)()
  .then(function(response) {
    logger.trackEvent("Find By Area", {}, { "Trail load duration": response.duration });
    console.log('Trail load took ' + response.duration + 'ms');
    return response.result;
  });

  return new Q(stopwatchPromise);
};
