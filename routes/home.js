/*
 * GET home page.
 */

export default function (app) {
  app.get("/", function (req, res) {
    res.redirect("/trails/pct/maps/azure");
  });
  app.get("/trails/pct/maps/:mapName", maps);
  app.get("/trails/pct/waypoints", waypoints);
  app.get('/health', (req, res) => {  
    res.status(200).send('Healthy');
  });    
}

function getValue(queryValue, fallbackValue) {
  var value = parseFloat(queryValue);
  return !isNaN(value) ? value : fallbackValue;
}

export function maps(req, res) {
  // TODO: 404 if it's not a map name we recognize
  // TODO: allow no map name, default to azure
  var defaults = {
    defaultMapName: req.params.mapName,
    defaultLatitude: getValue(req.query.lat, 40.50964),
    defaultLongitude: getValue(req.query.lon, -121.36232),
    defaultZoom: getValue(req.query.zoom, 5),
    // TODO: get these from the request url? Maybe just figure it out on the client?
    baseMapUrl: "/trails/pct/maps",
    waypointsUrl: "/trails/pct/waypoints",
    hereApiId: process.env.HERE_API_ID,
    hereApiCode: process.env.HERE_API_CODE
  };

  res.render("maps", defaults);
}

export function waypoints(req, res) {
  // TODO: 404 if it's not a map name we recognize

  res.render("waypoints");
}
