var fs = require("fs");
var dict = require("dict");
var trackDictionary = dict();

exports.numberOfTracksLoaded = 0;

var loadTrack = function(name, callback){
  var self = this;
  var data;

  function pointFilter(options, point) {
    return point.lat >= options.south &&
      point.lat <= options.north &&
      point.lon >= options.west &&
      point.lon <= options.east &&
      point.minZoom <= options.zoom;
  }

  function load(fileName, callback) {
    fs.readFile(fileName, 'utf8', function (err, text) {
      data = JSON.parse(text);
      callback(err);
    });
    exports.numberOfTracksLoaded++;
  }

  function getPoints(options) {
    var filterWithOptions = pointFilter.bind(undefined, options);
    return data.points.filter(filterWithOptions);
    // TODO: we can transform the points to remove data that the client doesn't need
    // by using Array.map. Probably elsewhere.
  }

  load("./data/" + name + ".json", function(err) {
    callback(err);
  });

  return {
    getPoints: getPoints,
  };
};

exports.getData = function(options, callback) {
  var track = trackDictionary.get(options.name);
  if (track) {
    callback(null, track.getPoints(options));
  }
  else
  {
    track = loadTrack(options.name, function(err) {
      callback(err, track.getPoints(options));
    });
    trackDictionary.set(options.name, track);
  }
};
