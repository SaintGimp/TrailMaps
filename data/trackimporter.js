var fs = require("fs"),
  xml2js = require('xml2js'),
  mongoClient = require('mongodb').MongoClient,
  async = require('async'),
  dataService = require("../domain/dataService.js");

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

Array.prototype.append = function(array)
{
    this.push.apply(this, array);
};

function readFile(fileName, callback) {
  console.log('Reading ' + fileName);
  fs.readFile(__dirname + "/../" + fileName, 'utf8', callback);
}

function parseData(track, trackXml, callback) {
  console.log('Parsing data');
  parser.parseString(trackXml, function(err, trackJson) {
    console.log('Converting ' + trackJson.gpx.trk[0].name);
    var trackPoints = trackJson.gpx.trk[0].trkseg[0].trkpt.map(function(point) {
      return {
        loc: [parseFloat(point.$.lon), parseFloat(point.$.lat)], // MongoDB likes longitude first
      };
    });
    track.append(trackPoints);
    callback(err);
  });
}

function addTrackData(track, fileName, callback) {
  console.log('Adding track data from ' + fileName);
  async.waterfall([
    async.apply(readFile, fileName),
    async.apply(parseData, track)
    ],
    callback
  );
}

function loadTrack(callback) {
  console.log('Loading track files');
  var track = [];
  async.forEachSeries(files,
    async.apply(addTrackData, track),
    function(err) {
      track.forEach(function(point, index) {
        point.seq = index;
      });
      callback(err, track);
    }
  );
}

function Collection(detailLevel) {
  this.data = [];
  this.detailLevel = detailLevel;
}

function buildCollections(track, callback) {
  console.log('Building collections');
  var stride = 1;
  var collections = [];
  for (var detailLevel = 16; detailLevel >= 1; detailLevel--)
  {
    var collection = new Collection(detailLevel);
    for (var x = 0; x < track.length; x += stride)
    {
      collection.data.push(track[x]);
    }
    collections.push(collection);
    stride *= 2;
  }

  callback(null, collections);
}

function connect(callback) {
  console.log('Connecting to database');
  dataService.db(callback);
}

function writeCollection(db, collection, callback)
{
  var collectionName = "pct_track" + collection.detailLevel;
  console.log('Writing collection ' + collectionName);
  async.series([
    function(callback) {
      db.collection(collectionName).insert(collection.data, {w:1}, callback);
    },
    function(callback) {
      db.collection(collectionName).ensureIndex({ loc: "2d" }, {w:1}, callback);
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
  console.log('Importing tracks');
  
  async.waterfall([
    loadTrack,
    buildCollections,
    saveCollections
    ],
    function(err) {
      console.log('Finished importing tracks');
      callback(err);
    }
  );
};