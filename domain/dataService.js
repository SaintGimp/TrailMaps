import { MongoClient } from "mongodb";

// Module-level variables for connection pool
let client = null;
let db = null;

function getMongoUrl() {
  if (process.env.MONGODB_URI) {
    console.log("Connecting to " + process.env.MONGODB_URI);
    return process.env.MONGODB_URI;
  } else {
    console.log("MongoDB connection string not found in environment variables.");
    return "";
  }
}

/**
 * Initialize MongoDB connection pool
 * Should be called once at application startup
 */
export async function connect() {
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
}

/**
 * Close MongoDB connection pool
 * Should be called during graceful shutdown
 */
export async function close() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB connection pool closed");
  }
}

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

export async function collection(name) {
  return getDb().collection(name);
}

export async function collections() {
  return getDb().collections();
}

/**
 * @param {string} collectionName
 * @param {import("mongodb").Filter<import("mongodb").Document>} searchTerms
 * @param {Object} [projection]
 * @param {import("mongodb").Sort} [sort]
 * @returns {Promise<import("mongodb").WithId<import("mongodb").Document>[]>}
 */
export async function findArray(collectionName, searchTerms, projection, sort) {
  var coll = await collection(collectionName);
  // @ts-ignore - projection type mismatch with driver but works at runtime
  return await coll.find(searchTerms, projection).limit(2000).sort(sort).toArray();
}

/**
 * @param {string} collectionName
 * @param {import("mongodb").Filter<import("mongodb").Document>} searchTerms
 * @param {Object} [projection]
 * @returns {Promise<import("mongodb").WithId<import("mongodb").Document> | null>}
 */
export async function findOne(collectionName, searchTerms, projection) {
  var coll = await collection(collectionName);
  // @ts-ignore - projection type mismatch
  return await coll.findOne(searchTerms, projection);
}

/**
 * @param {string} collectionName
 * @param {import("mongodb").Filter<import("mongodb").Document>} searchTerms
 * @param {import("mongodb").UpdateFilter<import("mongodb").Document>} updateOperation
 * @returns {Promise<import("mongodb").UpdateResult>}
 */
export async function update(collectionName, searchTerms, updateOperation) {
  var coll = await collection(collectionName);
  return await coll.updateOne(searchTerms, updateOperation, { w: 1 });
}

/**
 * @param {string} collectionName
 * @param {import("mongodb").Filter<import("mongodb").Document>} searchTerms
 * @returns {Promise<import("mongodb").DeleteResult>}
 */
export async function remove(collectionName, searchTerms) {
  var coll = await collection(collectionName);
  return await coll.deleteMany(searchTerms);
}

/**
 * @param {string} collectionName
 * @param {import("mongodb").OptionalUnlessRequiredId<import("mongodb").Document>} insertOperation
 * @returns {Promise<import("mongodb").InsertOneResult>}
 */
export async function insert(collectionName, insertOperation) {
  var coll = await collection(collectionName);
  return await coll.insertOne(insertOperation);
}

export default {
  connect,
  close,
  collection,
  collections,
  findArray,
  findOne,
  update,
  remove,
  insert
};
