var Q = require('q');
var QMongoDB = require('./q-mongodb');

var existingDb = null;

function getMongoUrl() {
  var mongo;
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  } else {
    console.log("Connecting to local MongoDB");
    return "mongodb://localhost:27017/trailmaps";
  }
}

function getDb() {
  if (existingDb) {
    return new Q(existingDb);
  }
  else
  {
    return QMongoDB.db(getMongoUrl())
    .then(function(db) {
      existingDb = db;
      return db;
    });
  }
}
exports.collection = function(name) {
  return getDb()
  .then(function(db) {
    return QMongoDB.collection(db, name);
  });
};

exports.collections = function() {
  return getDb()
    .then(function(db) {
      return Q.ninvoke(db, "collections");
    });
};

exports.findArray = function(collectionName, searchTerms, projection, sort) {
  return exports.collection(collectionName)
  .then(
    function(collection) {
      return Q.ninvoke(collection.find(searchTerms, projection).limit(2000).sort(sort), 'toArray');
    }
  );
};

exports.findOne = function(collectionName, searchTerms, projection) {
  return exports.collection(collectionName)
  .then(
    function(collection) {
      return Q.ninvoke(collection, 'findOne', searchTerms, projection);
    }
  );
};

exports.update = function(collectionName, searchTerms, updateOperation) {
  return exports.collection(collectionName)
  .then(
    function(collection) {
      return Q.ninvoke(collection, 'update', searchTerms, updateOperation, { w: 1 });
    }
  );
};

exports.remove = function(collectionName, searchTerms) {
  return exports.collection(collectionName)
  .then(
    function(collection) {
      return Q.ninvoke(collection, 'remove', searchTerms);
    }
  );
};
