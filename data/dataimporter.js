var Q = require('q');
var trackImporter = require('./trackimporter.js');
var mileMarkerImporter = require('./milemarkerimporter.js');
var waypointImporter = require('./waypointimporter.js');
var dataService = require("../domain/dataService.js");

function dropCollection(collection) {
  console.log("Dropping " + collection.collectionName);
  return Q.ninvoke(collection, 'drop');
}

function dropCollections(db, collectionsToDelete) {
  console.log('Dropping collections');

  return dataService.collections()
  .then(function(collections) {
    var collectionsToDrop = collections.filter(function(collection) {
      return collection.collectionName.match(/.*track\d+$/) || collection.collectionName.match(/.*milemarkers\d+$/) || collection.collectionName.match(/waypoints$/);
    });

    return Q.all(collectionsToDrop.map(function(collection) {
      return dropCollection(collection);
    }));
  });
}

exports.import = function() {
  console.log("Importing trail data");

  return dropCollections()
  .then(function() {
    return Q.all([trackImporter.import(), mileMarkerImporter.import(), waypointImporter.import()]);
  });
};

