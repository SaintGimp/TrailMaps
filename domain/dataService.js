var MongoClient = require('mongodb').MongoClient;
var db;

function queryArray(collectionName, searchTerms, projection, sort, callback) {
  db.collection(collectionName).find(searchTerms, projection).limit(2000).sort(sort).toArray(function (err, documents) {
    if (err) { console.dir(err); }
    callback(err, documents);
  });
}

function connectAndQuery(collectionName, searchTerms, projection, sort, queryFunction, callback) {
  MongoClient.connect('mongodb://localhost/TrailMaps', function(err, connectedDb) {
    if (err) {
      callback(err, null);
      return;
    }
    db = connectedDb;
    queryFunction(collectionName, searchTerms, projection, sort, callback);
  });
}

exports.findArray = function(collectionName, searchTerms, projection, sort, callback) {
  if (db)
  {
    queryArray(collectionName, searchTerms, projection, sort, callback);
  } else {
    connectAndQuery(collectionName, searchTerms, projection, sort, queryArray, callback);
  }
};

function queryOne(collectionName, searchTerms, projection, sort, callback) {
  db.collection(collectionName).findOne(searchTerms, projection, function (err, document) {
    if (err) { console.dir(err); }
    callback(err, document);
  });
}

exports.findOne = function(collectionName, searchTerms, projection, sort, callback) {
  if (db)
  {
    queryOne(collectionName, searchTerms, projection, sort, callback);
  } else {
    connectAndQuery(collectionName, searchTerms, projection, sort, queryOne, callback);
  }
};
