var fs = require("fs"),
  xml2js = require('xml2js'),
  mongoClient = require('mongodb').MongoClient,
  async = require('async');

var parser = new xml2js.Parser();

var files = [
  "data/pct_waypoints/ca_pct_waypoints/ca_pct_waypoints.gpx",
  "data/pct_waypoints/or_pct_waypoints/or_pct_waypoints.gpx",
  "data/pct_waypoints/wa_pct_waypoints/wa_pct_waypoints.gpx"
];

Array.prototype.append = function(array)
{
    this.push.apply(this, array);
};

function readFile(fileName, callback) {
  console.log('Reading ' + fileName);
  fs.readFile(__dirname + "/../" + fileName, 'utf8', callback);
}

function parseData(mileMarkers, waypointXml, callback) {
  console.log('Parsing data');
  parser.parseString(waypointXml, function(err, waypointJson) {
    console.log('Converting mile markers');
    var markerJson = waypointJson.gpx.wpt.filter(function(waypoint) {
      return waypoint.name[0].match(/^(?:\d{4}|\d{4}-\d)$/);
    });
    var newMarkers = markerJson.map(function(marker) {
      var name = marker.name[0].replace('-', '.');
      return {
        loc: [parseFloat(marker.$.lon), parseFloat(marker.$.lat)], // MongoDB likes longitude first
        mile: parseFloat(name)
      };
    });
    mileMarkers.append(newMarkers);
    callback(err);
  });
}

function addMarkerData(mileMarkers, fileName, callback) {
  console.log('Adding mile marker data from ' + fileName);
  async.waterfall([
    async.apply(readFile, fileName),
    async.apply(parseData, mileMarkers)
    ],
    callback
  );
}

function loadMileMarkers(callback) {
  console.log('Loading mile marker files');
  var mileMarkers = [];
  async.forEach(files,
    async.apply(addMarkerData, mileMarkers),
    function(err) {
      callback(err, mileMarkers);
    }
  );
}

function Collection(detailLevel) {
  this.data = [];
  this.detailLevel = detailLevel;
}

function buildCollections(mileMarkers, callback) {
  console.log('Building collections');
  var stride = 1;
  var collections = [];
  for (var detailLevel = 14; detailLevel >= 1; detailLevel--)
  {
    var collection = new Collection(detailLevel);
    for (var x = 0; x < mileMarkers.length; x += stride)
    {
      collection.data.push(mileMarkers[x]);
    }
    collections.push(collection);
    stride *= 2;
  }

  callback(null, collections);
}

function connect(callback) {
  console.log('Connecting to database');
  mongoClient.connect("mongodb://localhost/TrailMaps", callback);
}

function writeCollection(db, collection, callback)
{
  var collectionName = "pct_milemarkers" + collection.detailLevel;
  console.log('Writing collection ' + collectionName);
  async.series([
    function(callback) {
      db.collection(collectionName).insert(collection.data, {w:0}, callback);
    },
    function(callback) {
      db.collection(collectionName).ensureIndex({ loc: "2d" }, {w:0}, callback);
    }],
    callback
  );
}

function writeCollections(collections, db, callback) {
  console.log('Writing collections');
  async.forEach(collections,
    async.apply(writeCollection, db),
    callback
  );
}

function saveCollections(collections, callback) {
  console.log('Saving collections');
  async.waterfall([
    connect,
    async.apply(writeCollections, collections)
    ],
    callback
  );
}

exports.import = function(callback) {
  console.log('Importing mile markers');
  
  async.waterfall([
    loadMileMarkers,
    buildCollections,
    saveCollections
    ],
    function(err) {
      console.log('Finished importing mile markers');
      callback(err);
    }
  );
};