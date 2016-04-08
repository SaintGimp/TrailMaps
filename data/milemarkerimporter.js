var fs = require("fs"),
    xml2js = require('xml2js'),
    uuid = require('node-uuid'),
    Q = require('q'),
    _ = require('underscore'),
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

Array.prototype.append = function(array) {
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
            console.log('Converting mile markers');
            var markerJson = waypointJson.gpx.wpt.filter(function(waypoint) {
                return waypoint.name[0].match(/^(?:\d{4}|\d{4}-\d)$/);
            });
            var newMarkers = markerJson.map(function(marker) {
                var name = marker.name[0].replace('-', '.');
                return {
                    location: {
                        type: "Point",
                        coordinates: [parseFloat(point.$.lon), parseFloat(point.$.lat)] // GeoJSON wants longitude first
                    },
                    mile: parseFloat(name)
                };
            });
            return newMarkers;
        });
}

function loadFile(fileName) {
    console.log('Adding mile marker data from ' + fileName);

    return readFile(fileName)
        .then(parseData);
}

function loadMileMarkers() {
    console.log('Loading mile marker files');
    var mileMarkers = [];

    return Q.all(fileNames.map(function(fileName) {
        return loadFile(fileName);
    }))
        .then(function(fileContentSet) {
            fileContentSet.forEach(function(fileContent) {
                mileMarkers.append(fileContent);
            });

            var uniqueMarkers = _.uniq(mileMarkers, true, function(marker) {
                return marker.mile;
            });

            return uniqueMarkers;
        });
}

function buildDatasets(mileMarkers) {
    console.log('Building mile marker datasets');

    var stride = 1;
    var collections = [];
    for (var detailLevel = 14; detailLevel >= 1; detailLevel--) {
        var dataset = [];
        for (var x = 0; x < mileMarkers.length; x += stride) {
            var document = {
                id: uuid.v4(),
                app: 'trailmaps',
                type: 'mileMarker',
                trail: 'pct',
                detailLevel: detailLevel,
                location: mileMarkers[x].loc,
                mile: mileMarkers[x].mile
            };
            dataset.push(document);
        }
        datasets.push(dataset);
        stride *= 2;
    }

    return datasets;
}

function saveDatasets(datasets) {
    console.log('Saving mile marker datasets');
    return Q.all(datasets.map(function(dataset) {
        return dataService.bulkInsert(dataset);
    }));
}

exports.import = function() {
    console.log('Importing mile markers');

    return loadMileMarkers()
        .then(buildDatasets)
        .then(saveDatasets)
        .then(function() {
            console.log('Finished importing mile markers');
        });
};