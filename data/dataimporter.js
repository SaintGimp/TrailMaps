var trackImporter = require('./trackimporter.js');
var mileMarkerImporter = require('./milemarkerimporter.js');
var mongoClient = require('mongodb').MongoClient;
var async = require('async');
var dataService = require("../domain/dataService.js");

function connect(callback) {
  console.log('Connecting to database');
  dataService.db(callback);
}

function getCollectionNames(db, callback) {
  console.log('Getting collection names');
  db.collections(function(err, collections) {
    var names = collections.map(function(collection) {
      return collection.collectionName;
    });
    var namesToDrop = names.filter(function(name) {
      return name.match(/.*track\d+$/) || name.match(/.*milemarkers\d+$/);
    });
    callback(err, db, namesToDrop);
  });
}

function dropCollection(db, collectionName, callback) {
  console.log("Dropping " + collectionName);
  db.collection(collectionName).drop(callback);
}

function dropCollections(db, collectionsToDelete, callback) {
  console.log('Dropping collections');
  async.forEach(collectionsToDelete,
    async.apply(dropCollection, db),
    callback
  );
}

async.waterfall([
  connect,
  getCollectionNames,
  dropCollections,
  trackImporter.import,
  mileMarkerImporter.import
  ],
  function(err) {
    if (err) { console.dir(err); }
    process.exit(0);
  }
);

