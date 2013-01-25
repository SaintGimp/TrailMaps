var MongoClient = require('mongodb').MongoClient;
var db;

function query(collectionName, searchTerms, projection, sort, callback) {
  db.collection(collectionName).find(searchTerms, projection).sort(sort).toArray(function (err, documents) {
    if (err) { console.dir(err); }
    callback(err, documents);
  });
}

function connectAndQuery(collectionName, searchTerms, projection, sort, callback) {
  MongoClient.connect('mongodb://localhost/TrailMaps', function(err, connectedDb) {
    if (err) {
      callback(err, null);
      return;
    }
    db = connectedDb;
    query(collectionName, searchTerms, projection, sort, callback);
  });
}

exports.findArray = function(collectionName, searchTerms, projection, sort, callback) {
  if (db)
  {
    query(collectionName, searchTerms, projection, sort, callback);
  } else {
    connectAndQuery(collectionName, searchTerms, projection, sort, callback);
  }
};
