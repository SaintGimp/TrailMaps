var Q = require('q'),
    MongoClient = require('mongodb').MongoClient,
    _dbPromiseMap = {};

exports.db = function (serverUrl, dbName, options) {
  var dbKey = serverUrl + dbName,
    dbPromise = _dbPromiseMap[dbKey];

  if (!dbPromise) {
    dbPromise = Q.ninvoke(MongoClient, 'connect', serverUrl, options);
    _dbPromiseMap[dbKey] = dbPromise;
  }

  return dbPromise;
};

exports.collection = function (dbPromise, collectionName) {
  dbPromise = new Q(dbPromise);
  return dbPromise
  .then(function (db) {
    return Q.ninvoke(db, 'collection', collectionName)
    .then(function (collection) {
      if (!collection) {
        return Q.ninvoke(db, 'createCollection', collectionName);
      } else {
        return collection;
      }
    });
  });
};
