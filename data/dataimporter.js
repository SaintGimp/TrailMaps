var Q = require('q');
var trackImporter = require('./trackimporter.js');
var mileMarkerImporter = require('./milemarkerimporter.js');
var waypointImporter = require('./waypointimporter.js');
var dataService = require("../domain/dataService.js");

function deleteAllData() {
    console.log("Deleting all data");
    
    var querySpec = {
        query: 'SELECT * FROM root r WHERE r.app = @app',
        parameters: [{
            name: '@app',
            value: 'trailmaps'
        }]
    };
        
  return dataService.bulkDelete(querySpec);
}

exports.import = function() {
  console.log("Importing trail data");

  return deleteAllData()
  .then(function() {
    return trackImporter.import();
//    return Q.all([trackImporter.import(), mileMarkerImporter.import()]);
  })
  .then(waypointImporter.import);
};

