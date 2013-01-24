var MongoClient = require('mongodb').MongoClient;

var db;
var maxZoomLevel = 16;

function query(options, callback) {
  var zoom = options.zoom > maxZoomLevel ? maxZoomLevel : options.zoom;
  var collectionName = options.name + zoom;
  var searchTerms = {
   "loc": {
    "$within": {
       "$box": [[parseFloat(options.west), parseFloat(options.south)], [parseFloat(options.east), parseFloat(options.north)]]
     }
   }
  };
  var projection = { _id: 0, loc: 1 };
  db.collection(collectionName).find(searchTerms, projection).sort({ _id: 1 }).toArray(function (err, documents) {
    if (err) { console.dir(err); }
    callback(err, documents);
  });
}

function connectAndQuery(options, callback) {
  MongoClient.connect('mongodb://localhost/TrailMaps', function(err, connectedDb) {
    if (err) {
      callback(err, null);
      return;
    }
    db = connectedDb;
    exports.numberOfConnections++;
    query(options, callback);
  });
}

exports.getData = function(options, callback) {
  if (db)
  {
    query(options, callback);
  } else {
    connectAndQuery(options, callback);
  }
};

exports.numberOfConnections = 0;
