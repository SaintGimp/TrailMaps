var lastCall;

exports.getLastCall = function() { return lastCall; }

exports.shouldErrorOnNextCall = false;

exports.findArray = function(collectionName, searchTerms, projection, sortOrder, callback) {
  lastCall = {
    collectionName: collectionName,
    searchTerms: searchTerms,
    projection: projection,
    sortOrder: sortOrder
  };

  if (!exports.shouldErrorOnNextCall)
  {
    var dummyData = [
      { loc: [1, 2] },
      { loc: [3, 4] }
    ];

    callback(null, dummyData);
  } else {
    exports.shouldErrorOnNextCall = false;
    callback(new Error("Oops"), null);
  }
};

