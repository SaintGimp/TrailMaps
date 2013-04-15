var fs = require("fs"),
  xml2js = require('xml2js'),
  Q = require('Q'),
  dataService = require("../domain/dataService.js");


var parser = new xml2js.Parser();

var fileNames = [
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

function readFile(fileName) {
  console.log('Reading ' + fileName);
  return Q.nfcall(fs.readFile, __dirname + "/../" + fileName, 'utf8');
}

function parseData(trackXml) {
  console.log('Parsing data');

  return Q.ninvoke(parser, 'parseString', trackXml)
  .then(function(trackJson) {
    console.log('Converting ' + trackJson.gpx.trk[0].name);
    return trackJson.gpx.trk[0].trkseg[0].trkpt.map(function(point) {
      return {
        loc: [parseFloat(point.$.lon), parseFloat(point.$.lat)], // MongoDB likes longitude first
      };
    });
  });
}

function loadFile(fileName) {
  console.log('Adding track data from ' + fileName);

  return readFile(fileName)
  .then(parseData);
}

function loadTrack() {
  console.log('Loading track files');
  var track = [];

  return Q.all(fileNames.map(function(fileName) {
    return loadFile(fileName);
  }))
  .then(function (fileContentSet) {
    fileContentSet.forEach(function(fileContent) {
      track.append(fileContent);
    });

    track.forEach(function(point, index) {
      point.seq = index;
    });

    return track;
  });
}

function Collection(detailLevel) {
  this.data = [];
  this.detailLevel = detailLevel;
}

function buildCollections(track) {
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

  return collections;
}

function writeCollection(collection)
{
  var collectionName = "pct_track" + collection.detailLevel;
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

exports.import = function() {
  console.log('Importing tracks');

  return loadTrack()
  .then(buildCollections)
  .then(saveCollections)
  .then(function() {
    console.log('Finished importing tracks');
  });
};