var fs = require("fs");
var track;

exports.load = function(fileName, done) {
  fs.readFile(fileName, 'utf8', function (err,data) {
    track = JSON.parse(data);
    done();
  });
};

exports.getPoints = function(options) {
  var results = [];
  
  track.points.forEach(function(point) {
    if (point.lat >= options.south && point.lat <= options.north && point.lon >= options.west && point.lon <= options.east) {
      results.push(point);
    }
  });

  return results;
};
