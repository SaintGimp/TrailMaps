const MongoClient = require("mongodb").MongoClient;

var existingDbPromise = null;
var existingCollectionPromises = [];

function getMongoUrl() {
  if (process.env.MONGO_URI) {
    console.log("Connecting to " + process.env.MONGO_URI);
    return process.env.MONGO_URI;
  } else {
    console.log("Connecting to local MongoDB");
    return "mongodb://localhost:27017/trailmaps";
  }
}

async function getDb() {
  if (!existingDbPromise) {
    console.log("Creating new connection...");
    existingDbPromise = MongoClient.connect(getMongoUrl());
  }

  return await existingDbPromise;
}

async function getCollection(db, name) {
  if (!existingCollectionPromises[name]) {
    console.log("Getting new collection reference for " + name + "...");
    existingCollectionPromises[name] = db.collection(name);
    var collection = await existingCollectionPromises[name];
    if (!collection) {
      existingCollectionPromises[name] = await db.createCollection(name);
    }
  }

  return await existingCollectionPromises[name];
}

exports.collection = async function(name) {
  var db = await getDb();
  return await getCollection(db, name);
};

exports.collections = async function() {
  var db = await getDb();
  return await db.collections();
};

exports.findArray = async function(collectionName, searchTerms, projection, sort) {
  var collection = await exports.collection(collectionName);
  return await collection.find(searchTerms, projection).limit(2000).sort(sort).toArray();
};

exports.findOne = async function(collectionName, searchTerms, projection) {
  var collection = await exports.collection(collectionName);
  return await collection.findOne(searchTerms, projection);
};

exports.update = async function(collectionName, searchTerms, updateOperation) {
  var collection = await exports.collection(collectionName);
  return await collection.update(searchTerms, updateOperation, { w: 1 });
};

exports.remove = async function(collectionName, searchTerms) {
  var collection = await exports.collection(collectionName);
  return await collection.remove(searchTerms);
};
