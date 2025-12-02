import fs from "fs";
import { promisify } from "util";
import xml2js from "xml2js";
import * as dataService from "../domain/dataService.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      loc: {
        type: "Point",
        coordinates: [parseFloat(point.$.lon), parseFloat(point.$.lat)]
      }
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
    track.push(...fileContent);
  });

  track.forEach(function (point, index) {
    point.seq = index;
  });

  return track;
}

function buildTrackPoints(track) {
  console.log("Building track points");
  var stride = 1;
  var points = [];
  for (var detailLevel = 16; detailLevel >= 1; detailLevel--) {
    console.log("Building points for detail level " + detailLevel);
    for (var x = 0; x < track.length; x += stride) {
      var item = {
        trailName: "pct",
        detailLevel: detailLevel,
        seq: track[x].seq,
        loc: track[x].loc
      };
      points.push(item);
    }
    stride *= 2;
  }

  return points;
}

async function saveTrackPoints(points) {
  console.log("Saving " + points.length + " track points");
  // Use sequential execution to avoid overwhelming the emulator/service
  for (const item of points) {
    await dataService.create("tracks", item);
  }
}

export async function importTracks() {
  console.log("Importing tracks");

  var track = await loadTrack();
  var points = buildTrackPoints(track);
  await saveTrackPoints(points);

  console.log("Finished importing tracks");
}
