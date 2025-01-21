var fs = require("fs"),
  xml2js = require("xml2js"),
  Q = require("q"),
  _ = require("underscore"),
  dataService = require("../domain/dataService.js");

var parser = new xml2js.Parser();

var fileNames = [
  "data/pct/ca_state_gps/CA_Sec_A_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_B_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_C_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_D_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_E_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_F_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_G_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_H_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_I_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_J_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_K_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_L_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_M_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_N_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_O_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_P_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_Q_waypoints.gpx",
  "data/pct/ca_state_gps/CA_Sec_R_waypoints.gpx",

  "data/pct/or_state_gps/OR_Sec_B_waypoints.gpx",
  "data/pct/or_state_gps/OR_Sec_C_waypoints.gpx",
  "data/pct/or_state_gps/OR_Sec_D_waypoints.gpx",
  "data/pct/or_state_gps/OR_Sec_E_waypoints.gpx",
  "data/pct/or_state_gps/OR_Sec_F_waypoints.gpx",
  "data/pct/or_state_gps/OR_Sec_G_waypoints.gpx",

  "data/pct/wa_state_gps/WA_Sec_H_waypoints.gpx",
  "data/pct/wa_state_gps/WA_Sec_I_waypoints.gpx",
  "data/pct/wa_state_gps/WA_Sec_J_waypoints.gpx",
  "data/pct/wa_state_gps/WA_Sec_K_waypoints.gpx",
  "data/pct/wa_state_gps/WA_Sec_L_waypoints.gpx"
];

// TODO: is this still necessary or is it built in now?
Array.prototype.append = function(array)
{
  this.push.apply(this, array);
};

function readFile(fileName) {
  console.log("Reading " + fileName);
  return Q.nfcall(fs.readFile, __dirname + "/../" + fileName, "utf8");
}

async function parseData(waypointXml) {
  console.log("Parsing data");

  var waypointJson = await Q.ninvoke(parser, "parseString", waypointXml);

  console.log("Converting mile markers");
  var markerJson = waypointJson.gpx.wpt.filter(function(waypoint) {
    return waypoint.name[0].match(/^(?:\d{4}|\d{4}-\d)$/);
  });
  var newMarkers = markerJson.map(function(marker) {
    var name = marker.name[0].replace("-", ".");
    return {
      loc: [parseFloat(marker.$.lon), parseFloat(marker.$.lat)], // MongoDB likes longitude first
      mile: parseFloat(name)
    };
  });

  return newMarkers;
}

async function loadFile(fileName) {
  console.log("Adding mile marker data from " + fileName);

  var waypointXml = await readFile(fileName);
  var markers = await parseData(waypointXml);
  return markers;
}

async function loadMileMarkers() {
  console.log("Loading mile marker files");
  var mileMarkers = [];

  var loadingPromises = fileNames.map(function(fileName) {
    return loadFile(fileName);
  });
  var fileContentSet = await Promise.all(loadingPromises);

  fileContentSet.forEach(function(fileContent) {
    mileMarkers.append(fileContent);
  });

  var uniqueMarkers = _.uniq(mileMarkers, true, function(marker) {
    return marker.mile;
  });

  return uniqueMarkers;
}

function Collection(detailLevel) {
  this.data = [];
  this.detailLevel = detailLevel;
}

function buildCollections(mileMarkers) {
  console.log("Building collections");

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

async function writeCollection(collection)
{
  var collectionName = "pct_milemarkers" + collection.detailLevel;
  console.log("Writing collection " + collectionName);

  var mongoCollection = await dataService.collection(collectionName);
  await mongoCollection.insertMany(collection.data);
  console.log("Wrote collection " + collectionName);
  return await mongoCollection.ensureIndex({ loc: "2d" });
}

async function saveCollections(collections) {
  console.log("Saving collections");
  var savePromises = collections.map(function(collection) {
    return writeCollection(collection);
  });

  return await Promise.all(savePromises);
}

exports.import = async function() {
  console.log("Importing mile markers");

  var mileMarkers = await loadMileMarkers();
  var collections = await buildCollections(mileMarkers);
  await saveCollections(collections);

  console.log("Finished importing mile markers");
};