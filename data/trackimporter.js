import fs from "fs";
import { promisify } from "util";
import xml2js from "xml2js";
import * as dataService from "../domain/dataService.js";

var parser = new xml2js.Parser();
var readFileAsync = promisify(fs.readFile);
var parseStringAsync = promisify(parser.parseString.bind(parser));

// TODO: now that the 2015 dataset doesn"t have the "extras"
// files, we could probably just process all *.gpx files
// in the data directory and subs
var fileNames = [
  "data/pct/ca_state_gps/CA_Sec_A_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_B_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_C_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_D_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_E_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_F_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_G_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_H_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_I_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_J_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_K_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_L_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_M_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_N_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_O_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_P_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_Q_tracks.gpx",
  "data/pct/ca_state_gps/CA_Sec_R_tracks.gpx",

  "data/pct/or_state_gps/OR_Sec_B_tracks.gpx",
  "data/pct/or_state_gps/OR_Sec_C_tracks.gpx",
  "data/pct/or_state_gps/OR_Sec_D_tracks.gpx",
  "data/pct/or_state_gps/OR_Sec_E_tracks.gpx",
  "data/pct/or_state_gps/OR_Sec_F_tracks.gpx",
  "data/pct/or_state_gps/OR_Sec_G_tracks.gpx",

  "data/pct/wa_state_gps/WA_Sec_H_tracks.gpx",
  "data/pct/wa_state_gps/WA_Sec_I_tracks.gpx",
  "data/pct/wa_state_gps/WA_Sec_J_tracks.gpx",
  "data/pct/wa_state_gps/WA_Sec_K_tracks.gpx",
  "data/pct/wa_state_gps/WA_Sec_L_tracks.gpx"
];

Array.prototype.append = function (array) {
  this.push.apply(this, array);
};

function readFile(fileName) {
  console.log("Reading " + fileName);
  return readFileAsync(__dirname + "/../" + fileName, "utf8");
}

async function parseData(trackXml) {
  console.log("Parsing data");

  var trackJson = await parseStringAsync(trackXml);

  console.log("Converting " + trackJson.gpx.trk[0].name);
  return trackJson.gpx.trk[0].trkseg[0].trkpt.map(function (point) {
    return {
      loc: [parseFloat(point.$.lon), parseFloat(point.$.lat)] // MongoDB likes longitude first
    };
  });
}

async function loadFile(fileName) {
  console.log("Adding track data from " + fileName);

  var trackXml = await readFile(fileName);
  return await parseData(trackXml);
}

async function loadTrack() {
  console.log("Loading track files");
  var track = [];

  var loadPromises = fileNames.map(function (fileName) {
    return loadFile(fileName);
  });
  var fileContentSet = await Promise.all(loadPromises);
  fileContentSet.forEach(function (fileContent) {
    track.append(fileContent);
  });

  track.forEach(function (point, index) {
    point.seq = index;
  });

  return track;
}

function Collection(detailLevel) {
  this.data = [];
  this.detailLevel = detailLevel;
}

function buildCollections(track) {
  console.log("Building collections");
  var stride = 1;
  var collections = [];
  for (var detailLevel = 16; detailLevel >= 1; detailLevel--) {
    var collection = new Collection(detailLevel);
    for (var x = 0; x < track.length; x += stride) {
      collection.data.push(track[x]);
    }
    collections.push(collection);
    stride *= 2;
  }

  return collections;
}

async function writeCollection(collection) {
  var collectionName = "pct_track" + collection.detailLevel;
  console.log("Writing collection " + collectionName);

  var mongoCollection = await dataService.collection(collectionName);
  await mongoCollection.insertMany(collection.data);
  return await mongoCollection.createIndex({ loc: "2d" }, { w: 1 });
}

async function saveCollections(collections) {
  console.log("Saving collections");

  var savePromises = collections.map(function (collection) {
    return writeCollection(collection);
  });

  return await Promise.all(savePromises);
}

export async function importTracks() {}

export const importFunc = async function () {
  console.log("Importing tracks");

  var track = await loadTrack();
  var collections = await buildCollections(track);
  await saveCollections(collections);

  console.log("Finished importing tracks");
};
