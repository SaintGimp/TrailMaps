var fs = require("fs"),
  { promisify } = require("util"),
  xml2js = require("xml2js"),
  dataService = require("../domain/dataService.js");

var parser = new xml2js.Parser();
var readFileAsync = promisify(fs.readFile);
var parseStringAsync = promisify(parser.parseString.bind(parser));

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

function readFile(fileName) {
  console.log("Reading " + fileName);
  return readFileAsync(__dirname + "/../" + fileName, "utf8");
}

function cleanupName(name) {
  // This runs after we've filtered out waypoints based on matches.  Now
  // we want to modify the remaining waypoints to have better names. First
  // we remove certain substrings, then we split on certain delimiters to
  // get rid of descriptive text, then we do more replacements.

  name = name.replace(/^Paved, one lane /, "");

  var primaryName = name.split(/\. |\.$|, | - | \(| \[| is |\.</, 1)[0].trim();

  primaryName = primaryName.replace(/^(Paved |Unpaved |Gravel |Seasonal )/, "");
  primaryName = primaryName.replace(/^Arrive /, "");
  primaryName = primaryName.replace(/Hwy/, "Highway");
  primaryName = primaryName.replace(/ outlet$/, "");
  primaryName = primaryName.replace(/Rd/, "Road");
  return primaryName.trim();
}

async function getSequenceNumber(location) {
  var trackPoint = await dataService.findOne("pct_track16", { loc: { $near: location } }, { seq: 1 });
  return trackPoint.seq;
}

async function parseData(waypointXml) {
  console.log("Parsing data");

  var waypointJson = await parseStringAsync(waypointXml);
  console.log("Converting waypoints");
  var filteredWaypointJson = waypointJson.gpx.wpt.filter(function (waypoint) {
    return (
      !waypoint.name[0].match(/^(?:\d{4}|\d{4}-\d)$/) &&
      waypoint.desc &&
      !waypoint.desc[0].match(/bivy campsite/i) &&
      !waypoint.desc[0].match(/campsite/i) &&
      !waypoint.desc[0].match(/^Continue /) &&
      !waypoint.desc[0].match(/^Creek/) &&
      !waypoint.desc[0].match(/^Cross/) &&
      !waypoint.desc[0].match(/^Depart/) &&
      !waypoint.desc[0].match(/^Descend/) &&
      !waypoint.desc[0].match(/^Fence/) &&
      !waypoint.desc[0].match(/^Ford a/) &&
      !waypoint.desc[0].match(/^Gate/) &&
      !waypoint.desc[0].match(/^Gravel road/) &&
      //!waypoint.desc[0].match(/^Forest Road/) &&
      !waypoint.desc[0].match(/^Headwaters/) &&
      !waypoint.desc[0].match(/jeep road/i) &&
      !waypoint.desc[0].match(/^Keep /) &&
      !waypoint.desc[0].match(/^Lake$/) &&
      !waypoint.desc[0].match(/^Left /) &&
      !waypoint.desc[0].match(/of PCT on the JMT/) &&
      !waypoint.desc[0].match(/^Paved road/) &&
      !waypoint.desc[0].match(/^PCT /) &&
      !waypoint.desc[0].match(/^Pipe /) &&
      !waypoint.desc[0].match(/powerline/i) &&
      !waypoint.desc[0].match(/^Railroad tracks/) &&
      !waypoint.desc[0].match(/^Right /) &&
      //!waypoint.desc[0].match(/^Road /) &&
      !waypoint.desc[0].match(/^Seasonal creek/i) &&
      !waypoint.desc[0].match(/^Seasonal spring/i) &&
      !waypoint.desc[0].match(/^Seasonal stream/i) &&
      !waypoint.desc[0].match(/^Seasonal trail/i) &&
      !waypoint.desc[0].match(/^Seasonal water/i) &&
      !waypoint.desc[0].match(/^Several /) &&
      !waypoint.desc[0].match(/^Ski lift/) &&
      !waypoint.desc[0].match(/^Small /) &&
      !waypoint.desc[0].match(/^Spring/) &&
      !waypoint.desc[0].match(/^Spur /) &&
      !waypoint.desc[0].match(/^Stream/) &&
      !waypoint.desc[0].match(/^The PCT/) &&
      !waypoint.desc[0].match(/^Trail junction/) &&
      !waypoint.desc[0].match(/^Trail to/) &&
      !waypoint.desc[0].match(/^Trailside/) &&
      !waypoint.desc[0].match(/^Unmarked/) &&
      !waypoint.desc[0].match(/^Unpaved road/) &&
      !waypoint.desc[0].match(/^Water/) &&
      !waypoint.desc[0].match(/^Wire/)
    );
  });

  var waypoints = filteredWaypointJson.map(function (waypoint) {
    return {
      name: cleanupName(waypoint.desc[0]),
      loc: [parseFloat(waypoint.$.lon), parseFloat(waypoint.$.lat)], // MongoDB likes longitude first
      halfmileName: waypoint.name[0],
      halfmileDescription: waypoint.desc[0]
    };
  });

  var sequencePromises = waypoints.map(async function (waypoint) {
    var sequenceNumber = await getSequenceNumber(waypoint.loc);
    waypoint.seq = sequenceNumber;
    return waypoint;
  });

  return await Promise.all(sequencePromises);
}

async function loadFile(fileName) {
  console.log("Adding waypoint data from " + fileName);

  var waypointXml = await readFile(fileName);
  return await parseData(waypointXml);
}

async function loadWaypoints() {
  console.log("Loading waypoint files");
  var waypoints = [];

  var loadPromises = fileNames.map(function (fileName) {
    return loadFile(fileName);
  });

  var fileContentSet = await Promise.all(loadPromises);
  fileContentSet.forEach(function (fileContent) {
    waypoints.push(...fileContent);
  });

  return waypoints;
}

async function saveCollection(collection) {
  var collectionName = "pct_waypoints";
  console.log("Saving collection " + collectionName);

  var mongoCollection = await dataService.collection(collectionName);
  await mongoCollection.insertMany(collection);
  return await mongoCollection.createIndex({ loc: "2d" }, { w: 1 });
}

exports.import = async function () {
  console.log("Importing waypoints");

  var waypoints = await loadWaypoints();
  await saveCollection(waypoints);

  console.log("Finished importing waypoints");
};
