
/*
 * GET home page.
 */

module.exports = function(app) {
  app.get("/", function(req, res) {
    res.redirect("/trails/pct/maps/bing");
  });
  app.get("/trails/pct/maps/:mapName", exports.maps);
  app.get("/trails/pct/waypoints", exports.waypoints);
};

function getValue(queryValue, fallbackValue) {
  var value = parseFloat(queryValue);
  return !isNaN(value) ? value : fallbackValue;
}

exports.maps = function(req, res) {
  // TODO: 404 if it's not a map name we recognize
  // TODO: allow no map name, default to Bing
  var defaults = {
    defaultMapName: req.params.mapName,
    defaultLatitude: getValue(req.query.lat, 40.50642708521896),
    defaultLongitude: getValue(req.query.lon, -121.36087699433327),
    defaultZoom: getValue(req.query.zoom, 5),
    // TODO: get these from the request url? Maybe just figure it out on the client?
    baseMapUrl: "/trails/pct/maps",
    waypointsUrl: "/trails/pct/waypoints",
    googleApiKey: process.env.GOOGLE_API_KEY,
    hereApiId: process.env.HERE_API_ID,
    hereApiCode: process.env.HERE_API_CODE
  };

  res.render("maps", defaults);
};

exports.waypoints = function(req, res) {
  // TODO: 404 if it's not a map name we recognize

  res.render("waypoints");
};
