var fs = require("fs");
var track;

exports.load = function(fileName, done) {
  fs.readFile(fileName, 'utf8', function (err,data) {
    track = JSON.parse(data);
    done();
  });
};

exports.getTrackData = function(options){
  return track.points;
};
