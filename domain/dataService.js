var MongoClient = require('mongodb').MongoClient;
var async = require('async');
var connectedDb;

function getMongoUrl() {
  var mongo;
  if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    mongo = env['mongodb-2.0'][0].credentials;
  } else {
    mongo = {
      "hostname": "localhost",
      "port": 27017,
      "username": "",
      "password": "",
      "name": "",
      "db": "TrailMaps"
    };
  }

  if (mongo.username && mongo.password) {
    return "mongodb://" + mongo.username + ":" + mongo.password + "@" + mongo.hostname + ":" + mongo.port + "/" + mongo.db;
  } else {
    return "mongodb://" + mongo.hostname + ":" + mongo.port + "/" + mongo.db;
  }
}

function connect(callback) {
  if (connectedDb) {
    callback(null, connectedDb);
  } else {
    MongoClient.connect(getMongoUrl(), callback);
  }
}

function queryArray(collectionName, searchTerms, projection, sort, db, callback) {
  db.collection(collectionName).find(searchTerms, projection).limit(2000).sort(sort).toArray(function (err, documents) {
    if (err) { console.dir(err); }
    callback(err, documents);
  });
}

function queryOne(collectionName, searchTerms, projection, sort, db, callback) {
  db.collection(collectionName).findOne(searchTerms, projection, function (err, document) {
    if (err) { console.dir(err); }
    callback(err, document);
  });
}

exports.findArray = function(collectionName, searchTerms, projection, sort, callback) {
  async.waterfall([
    connect,
    async.apply(queryArray, collectionName, searchTerms, projection, sort)
    ],
    callback
  );
};

exports.findOne = function(collectionName, searchTerms, projection, sort, callback) {
  async.waterfall([
    connect,
    async.apply(queryOne, collectionName, searchTerms, projection, sort)
    ],
    callback
  );
};

exports.db = function(callback) {
  connect(callback);
};
