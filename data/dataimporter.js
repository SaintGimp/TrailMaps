import * as trackImporter from "./trackimporter.js";
import * as mileMarkerImporter from "./milemarkerimporter.js";
import * as dataService from "../domain/dataService.js";

async function dropCollections() {
  console.log("Dropping collections");

  var collections = await dataService.collections();
  var collectionsToDrop = collections.filter(function (collection) {
    return collection.collectionName.match(/.*track\d+$/) || collection.collectionName.match(/.*milemarkers\d+$/);
  });

  var dropPromises = collectionsToDrop.map(function (collection) {
    console.log("Dropping " + collection.collectionName);
    return collection.drop();
  });

  return await Promise.all(dropPromises);
}

export async function importData() {
  console.log("Importing trail data");

  await dropCollections();
  await Promise.all([trackImporter.importTracks(), mileMarkerImporter.importMileMarkers()]);
}

export default {
  import: importData
};
