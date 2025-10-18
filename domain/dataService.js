const { MongoClient } = require("mongodb");

// Module-level variables for connection pool
let client = null;
let db = null;

function getMongoUrl() {
  if (process.env.MONGO_URI) {
    console.log("Connecting to " + process.env.MONGO_URI);
    return process.env.MONGO_URI;
  } else {
    console.log("Connecting to local MongoDB");
    return "mongodb://127.0.0.1:27017/trailmaps";
  }
}

/**
 * Initialize MongoDB connection pool
 * Should be called once at application startup
 */
exports.connect = async function () {
  if (client) {
    return db;
  }

  const url = getMongoUrl();
  client = new MongoClient(url, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  });

  await client.connect();
  db = client.db("trailmaps");

  return db;
};

/**
 * Close MongoDB connection pool
 * Should be called during graceful shutdown
 */
exports.close = async function () {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB connection pool closed");
  }
};

/**
 * Get database instance
 * Throws error if not connected
 */
function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connect() first.");
  }
  return db;
}

exports.collection = async function (name) {
  return getDb().collection(name);
};

exports.collections = async function () {
  return getDb().collections();
};

exports.findArray = async function (collectionName, searchTerms, projection, sort) {
  var collection = await exports.collection(collectionName);
  return await collection.find(searchTerms, projection).limit(2000).sort(sort).toArray();
};

exports.findOne = async function (collectionName, searchTerms, projection) {
  var collection = await exports.collection(collectionName);
  return await collection.findOne(searchTerms, projection);
};

exports.update = async function (collectionName, searchTerms, updateOperation) {
  var collection = await exports.collection(collectionName);
  return await collection.updateOne(searchTerms, updateOperation, { w: 1 });
};

exports.remove = async function (collectionName, searchTerms) {
  var collection = await exports.collection(collectionName);
  return await collection.deleteMany(searchTerms);
};

exports.insert = async function (collectionName, insertOperation) {
  var collection = await exports.collection(collectionName);
  return await collection.insertOne(insertOperation);
};
