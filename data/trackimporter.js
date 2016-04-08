var fs = require("fs"),
    xml2js = require('xml2js'),
    uuid = require('node-uuid'),
    Q = require('q'),
    dataService = require("../domain/dataService.js");


var parser = new xml2js.Parser();

// TODO: now that the 2015 dataset doesn't have the "extras"
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

Array.prototype.append = function(array) {
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
                    location: {
                        type: "Point",
                        coordinates: [parseFloat(point.$.lon), parseFloat(point.$.lat)] // GeoJSON wants longitude first
                    }
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
        .then(function(fileContentSet) {
            fileContentSet.forEach(function(fileContent) {
                track.append(fileContent);
            });

            track.forEach(function(point, index) {
                point.sequence = index;
            });

            return track;
        });
}

function buildDatasets(track) {
    console.log('Building track datasets');
    var stride = 1;
    var datasets = [];
    for (var detailLevel = 16; detailLevel >= 1; detailLevel--) {
        var dataset = [];
        for (var x = 0; x < track.length; x += stride) {
            var document = {
                id: uuid.v4(),
                app: 'trailmaps',
                type: 'track',
                trail: 'pct',
                detailLevel: detailLevel,
                sequence: track[x].sequence,
                location: track[x].location
            };
            dataset.push(document);
        }
        datasets.push(dataset);
        stride *= 2;
    }

    return datasets;
}

function saveDatasets(datasets) {
    console.log('Saving track datasets');
    return datasets.reduce(function(promise, item) {
        return promise.then(function() {
            return dataService.bulkInsert(item);
        });        
    }, Q());
}

exports.import = function() {
    console.log('Importing tracks');

    return loadTrack()
        .then(buildDatasets)
        .then(saveDatasets)
        .then(function() {
            console.log('Finished importing tracks');
        });
};