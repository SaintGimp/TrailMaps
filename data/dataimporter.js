var trackImporter = require("./trackimporter.js");
var mileMarkerImporter = require("./milemarkerimporter.js");
var dataService = require("../domain/dataService.js");

async function dropCollections() {
  console.log("Dropping collections");

  var collections = await dataService.collections();
  var collectionsToDrop = collections.filter(function(collection) {
    return collection.collectionName.match(/.*track\d+$/) || collection.collectionName.match(/.*milemarkers\d+$/);
  });

  var dropPromises = collectionsToDrop.map(function(collection) {
    console.log("Dropping " + collection.collectionName);
    return collection.drop();
  });

  return await Promise.all(dropPromises);
}

exports.import = async function() {
  console.log("Importing trail data");

  await dropCollections();
  await Promise.all([trackImporter.import(), mileMarkerImporter.import()]);
};

