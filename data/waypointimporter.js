var fs = require("fs"),
  xml2js = require('xml2js'),
  mongoClient = require('mongodb').MongoClient,
  Q = require('q'),
  _ = require('underscore'),
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
   console.log('Converting waypoints');
    var filteredWaypointJson = waypointJson.gpx.wpt.filter(function(waypoint) {
      return !waypoint.name[0].match(/^(?:\d{4}|\d{4}-\d)$/) && waypoint.desc;
    });
    var newWaypoints = filteredWaypointJson.map(function(waypoint) {
      return {
        name: waypoint.desc[0],
        loc: [parseFloat(waypoint.$.lon), parseFloat(waypoint.$.lat)] // MongoDB likes longitude first
      };
    });
    return newWaypoints;
  });
}

function loadFile(fileName) {
  console.log('Adding waypoint data from ' + fileName);

  return readFile(fileName)
  .then(parseData);
}

function loadWaypoints() {
  console.log('Loading waypoint files');
  var waypoints = [];

  return Q.all(fileNames.map(function(fileName) {
    return loadFile(fileName);
  }))
  .then(function (fileContentSet) {
    fileContentSet.forEach(function(fileContent) {
      waypoints.append(fileContent);
    });

    return waypoints;
  });
}

function saveCollection(collection)
{
  var collectionName = "pct_waypoints";
  console.log('Saving collection ' + collectionName);

  return dataService.collection(collectionName)
  .then(function(mongoCollection) {
    return Q.ninvoke(mongoCollection, 'insert', collection, {w:1});
    //.then(function() {
      //return Q.ninvoke(mongoCollection, 'ensureIndex', { loc: "2d" }, {w:1});
    //});
  });
}

exports.import = function() {
  console.log('Importing waypoints');

  return loadWaypoints()
  .then(saveCollection)
  .then(function() {
    console.log('Finished importing waypoints');
  });
};