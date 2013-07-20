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

function cleanupName(name) {
  var namePart = name.split(" - ")[0];
  var majorNamePart = namePart.split(",")[0];
  return majorNamePart;
}

function getSequenceNumber(location) {
  return dataService.findOne('pct_track16', { loc: { $near: location } }, { seq: 1 })
  .then(function(trackPoint) {
    return trackPoint.seq;
  });
}

function parseData(waypointXml) {
  console.log('Parsing data');

  return Q.ninvoke(parser, 'parseString', waypointXml)
  .then(function(waypointJson) {
   console.log('Converting waypoints');
    var filteredWaypointJson = waypointJson.gpx.wpt.filter(function(waypoint) {
      return !waypoint.name[0].match(/^(?:\d{4}|\d{4}-\d)$/) &&
       waypoint.desc &&
       !waypoint.desc[0].match(/^Campsite/) &&
       !waypoint.desc[0].match(/^Creek/) &&
       !waypoint.desc[0].match(/^Cross/) &&
       !waypoint.desc[0].match(/^Depart/) &&
       !waypoint.desc[0].match(/^Descend/) &&
       !waypoint.desc[0].match(/^Gate/) &&
       !waypoint.desc[0].match(/^Forest Road/) &&
       !waypoint.desc[0].match(/^Headwaters/) &&
       !waypoint.desc[0].match(/^Keep /) &&
       !waypoint.desc[0].match(/^Left /) &&
       !waypoint.desc[0].match(/^PCT departs/) &&
       !waypoint.desc[0].match(/^PCT follows/) &&
       !waypoint.desc[0].match(/^PCT joins/) &&
       !waypoint.desc[0].match(/^Paved/) &&
       !waypoint.desc[0].match(/^Pipe /) &&
       !waypoint.desc[0].match(/^Powerline /) &&
       !waypoint.desc[0].match(/^Right /) &&
       !waypoint.desc[0].match(/^Road /) &&
       !waypoint.desc[0].match(/^Seasonal creek/i) &&
       !waypoint.desc[0].match(/^Seasonal spring/i) &&
       !waypoint.desc[0].match(/^Seasonal stream/i) &&
       !waypoint.desc[0].match(/^Seasonal water/i) &&
       !waypoint.desc[0].match(/^Several /) &&
       !waypoint.desc[0].match(/^Small /) &&
       !waypoint.desc[0].match(/^Spring/) &&
       !waypoint.desc[0].match(/^Spur /) &&
       !waypoint.desc[0].match(/^Stream/) &&
       !waypoint.desc[0].match(/^Trail junction/) &&
       !waypoint.desc[0].match(/^Trail to/) &&
       !waypoint.desc[0].match(/^Trailside/) &&
       !waypoint.desc[0].match(/^Unmarked/) &&
       !waypoint.desc[0].match(/^Unpaved/) &&
       !waypoint.desc[0].match(/^Water/) &&
       !waypoint.desc[0].match(/^Wire/);
    });
    var newWaypoints = filteredWaypointJson.map(function(waypoint) {
      return {
        name: cleanupName(waypoint.desc[0]),
        loc: [parseFloat(waypoint.$.lon), parseFloat(waypoint.$.lat)], // MongoDB likes longitude first
        halfmileName: waypoint.name[0]
      };
    });
    return newWaypoints;
  })
  .then(function(waypoints) {
    return Q.all(waypoints.map(function(waypoint) {
      return getSequenceNumber(waypoint.loc)
      .then(function(sequenceNumber) {
        waypoint.seq = sequenceNumber;
        return waypoint;
      });
    }));
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