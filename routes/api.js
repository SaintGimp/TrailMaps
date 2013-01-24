/*
 * Serve JSON to our AngularJS client
 */

 var tracks = require("../domain/tracks.js");

module.exports = function(app) {
  app.get('/api/trails/:name', exports.trails);
};

exports.trails = function (req, res) {
  var options = {
    name: req.params.name,
    north: req.query.north,
    south: req.query.south,
    east: req.query.east,
    west: req.query.west,
    zoom: req.query.zoom
  };
  tracks.getData(options, function(err, data) {
    if (err) { throw new Error(err); }
    res.json({points: data});
  });
};