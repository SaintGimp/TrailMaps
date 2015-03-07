var Q = require('q');
var QMongoDB = require('./q-mongodb');

function getMongoUrl() {
  var mongo;
  if (process.env.MONGO_URI) {
    console.log("MongoDB connection string: " + process.env.MONGO_URI);
    return process.env.MONGO_URI;
  } else {
    console.log("Connecting to local MongoDB");
    return "mongodb://localhost:27017/trailmaps";
  }
}

exports.collection = function(name) {
  return QMongoDB.db(getMongoUrl())
  .then(function(db) {
    return QMongoDB.collection(db, name);
  });
};

exports.collections = function() {
  return QMongoDB.db(getMongoUrl())
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
