const { MongoClient } = require("mongodb");

function getMongoUrl() {
  if (process.env.MONGO_URI) {
    console.log("Connecting to " + process.env.MONGO_URI);
    return process.env.MONGO_URI;
  } else {
    console.log("Connecting to local MongoDB");
    return "mongodb://127.0.0.1:27017/trailmaps";
  }
}

async function getDb() {
  console.log("Creating new connection...");
  var client = new MongoClient(getMongoUrl());
  await client.connect();

  return client.db("trailmaps");
}

exports.collection = async function(name) {
  var db = await getDb();
  return db.collection(name);
};

exports.collections = async function() {
  var db = await getDb();
  return db.collections();
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

exports.insert = async function(collectionName, insertOperation) {
  var collection = await exports.collection(collectionName);
  return await collection.insertOne(insertOperation);
};
