var fs = require("fs"),
  xml2js = require('xml2js'),
  mongoClient = require('mongodb').MongoClient;

var parser = new xml2js.Parser();

var files = [
  "data/pct_waypoints/ca_pct_waypoints/ca_pct_waypoints.gpx",
  "data/pct_waypoints/or_pct_waypoints/or_pct_waypoints.gpx",
  "data/pct_waypoints/wa_pct_waypoints/wa_pct_waypoints.gpx"
];

var waypoints = [];

var pointCounter = 0;
var waypoint;

var parseWaypointData = function(err, data) {
  var parsedPoint;
  var parsedPoints = data.gpx.wpt;
  for (var x = 0; x < parsedPoints.length; x++)
  {
    parsedPoint = parsedPoints[x];
    // There are other POI waypoints in the file - skip them for now
    if (parsedPoint.name[0].match(/^(?:\d{4}|\d{4}-\d)$/)) {
      waypoint = {
        loc: [parseFloat(parsedPoint.$.lon), parseFloat(parsedPoint.$.lat)], // MongoDB likes longitude first
        distance: parseFloat(parsedPoint.name[0].replace('-', '.'))
      };
      if (waypoint.distance >= 0) {
        waypoints.push(waypoint);
      } else {
        console.log("Bad waypoint: ");
        console.log(waypoint);
      }
    }
  }
};

// Load XML files into JSON
for (var x = 0; x < files.length; x++)
{
  console.log(files[x]);
  // Synchronous read because we want to parse the files in the order listed
  var xml = fs.readFileSync(__dirname + "/../" + files[x], 'utf8');
  parser.parseString(xml, parseWaypointData);
}

// Set minimum zoom level for each point
var stride = 1;
var collections = [];
var collection = [];
for (var zoomLevel = 14; zoomLevel >= 1; zoomLevel--)
{
  for (var x = 0; x < waypoints.length; x += stride)
  {
    collection.push(waypoints[x]);
  }
  collections.push({ data: collection, zoomLevel: zoomLevel });
  collection = [];
  stride *= 2;
}

mongoClient.connect("mongodb://localhost/TrailMaps", function(err, db) {
  if (err) { return console.dir(err); }
  collections.forEach(function (collection){
    var collectionName = "pct_waypoints" + collection.zoomLevel;
    db.collection(collectionName).insert(collection.data, {w:0});
    db.collection(collectionName).ensureIndex({loc: "2d"}, {w:0});
  });
  console.log("Finished");
});