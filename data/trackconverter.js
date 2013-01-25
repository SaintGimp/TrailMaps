var fs = require("fs"),
  xml2js = require('xml2js'),
  mongoClient = require('mongodb').MongoClient;

var parser = new xml2js.Parser();

var files = [
  "data/pct_tracks/ca_pct_tracks/ca_section_a_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_b_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_c_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_d_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_e_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_f_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_g_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_h_track_part_1.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_h_track_part_2.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_i_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_j_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_k_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_l_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_m_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_n_track_part_1.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_n_track_part_2.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_o_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_p_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_q_track.gpx",
  "data/pct_tracks/ca_pct_tracks/ca_section_r_track.gpx",

  "data/pct_tracks/or_pct_tracks/or_section_b_track.gpx",
  "data/pct_tracks/or_pct_tracks/or_section_c_track.gpx",
  "data/pct_tracks/or_pct_tracks/or_section_d_track.gpx",
  "data/pct_tracks/or_pct_tracks/or_section_e_track.gpx",
  "data/pct_tracks/or_pct_tracks/or_section_f_track.gpx",
  "data/pct_tracks/or_pct_tracks/or_section_g_track.gpx",

  "data/pct_tracks/wa_pct_tracks/wa_section_h_track_part_1.gpx",
  "data/pct_tracks/wa_pct_tracks/wa_section_h_track_part_2.gpx",
  "data/pct_tracks/wa_pct_tracks/wa_section_i_track.gpx",
  "data/pct_tracks/wa_pct_tracks/wa_section_j_track.gpx",
  "data/pct_tracks/wa_pct_tracks/wa_section_k_track.gpx",
  "data/pct_tracks/wa_pct_tracks/wa_section_l_track.gpx"
];

var track = [];

var pointCounter = 0;
var trackPoint;

var parseGpsData = function(err, data) {
  var parsedPoint;
  var parsedPoints = data.gpx.trk[0].trkseg[0].trkpt;
  for (var x = 0; x < parsedPoints.length; x++)
  {
    parsedPoint = parsedPoints[x];
    trackPoint = {
      loc: [parseFloat(parsedPoint.$.lon), parseFloat(parsedPoint.$.lat)] // MongoDB likes longitude first
    };
    track.push(trackPoint);
  }
};

// Load XML files into JSON
for (var x = 0; x < files.length; x++)
{
  console.log(files[x]);
  // Synchronous read because we want to parse the files in the order listed
  var xml = fs.readFileSync(__dirname + "/../" + files[x], 'utf8');
  parser.parseString(xml, parseGpsData);
}

// Set minimum zoom level for each point
var stride = 1;
var collections = [];
var collection = [];
for (var zoomLevel = 16; zoomLevel >= 1; zoomLevel--)
{
  for (var x = 0; x < track.length; x += stride)
  {
    collection.push(track[x]);
  }
  collections.push({ data: collection, zoomLevel: zoomLevel });
  collection = [];
  stride *= 2;
}

mongoClient.connect("mongodb://localhost/TrailMaps", function(err, db) {
  if (err) { return console.dir(err); }
  collections.forEach(function (collection){
    var collectionName = "pct_track" + collection.zoomLevel;
    db.collection(collectionName).insert(collection.data, {w:0});
    db.collection(collectionName).ensureIndex({loc: "2d"}, {w:0});
  });
  console.log("Finished");
});
