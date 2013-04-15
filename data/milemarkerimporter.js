var fs = require("fs"),
  xml2js = require('xml2js'),
  mongoClient = require('mongodb').MongoClient,
  Q = require('q'),
  dataService = require("../domain/dataService.js");

var parser = new xml2js.Parser();

var fileNames = [
  "data/pct_waypoints/ca_pct_waypoints/ca_pct_waypoints.gpx",
  "data/pct_waypoints/or_pct_waypoints/or_pct_waypoints.gpx",
  "data/pct_waypoints/wa_pct_waypoints/wa_pct_waypoints.gpx"
];

Array.prototype.append = function(array)
{
    this.push.apply(this, array);
};

function readFile(fileName) {
  console.log('Reading ' + fileName);
  return Q.nfcall(fs.readFile, __dirname + "/../" + fileName, 'utf8');
}

function parseData(waypointXml) {
  console.log('Parsing data');

  return Q.ninvoke(parser, 'parseString', waypointXml)
  .then(function(waypointJson) {
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
    return newMarkers;
  });
}

function loadFile(fileName) {
  console.log('Adding mile marker data from ' + fileName);

  return readFile(fileName)
  .then(parseData);
}

function loadMileMarkers(callback) {
  console.log('Loading mile marker files');
  var mileMarkers = [];

  return Q.all(fileNames.map(function(fileName) {
    return loadFile(fileName);
  }))
  .then(function (fileContentSet) {
    fileContentSet.forEach(function(fileContent) {
      mileMarkers.append(fileContent);
    });

    return mileMarkers;
  });
}

function Collection(detailLevel) {
  this.data = [];
  this.detailLevel = detailLevel;
}

function buildCollections(mileMarkers) {
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

  return collections;
}

function writeCollection(collection)
{
  var collectionName = "pct_milemarkers" + collection.detailLevel;
  console.log('Writing collection ' + collectionName);

  return dataService.collection(collectionName)
  .then(function(mongoCollection) {
    return Q.ninvoke(mongoCollection, 'insert', collection.data, {w:1})
    .then(function() {
      return Q.ninvoke(mongoCollection, 'ensureIndex', { loc: "2d" }, {w:1});
    });
  });
}

function saveCollections(collections) {
  console.log('Saving collections');
  return Q.all(collections.map(function(collection) {
    return writeCollection(collection);
  }));
}

exports.import = function(callback) {
  console.log('Importing mile markers');

  return loadMileMarkers()
  .then(buildCollections)
  .then(saveCollections)
  .then(function() {
    console.log('Finished importing mile markers');
  });
};