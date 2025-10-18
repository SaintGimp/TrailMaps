var lastCall;

exports.getLastCall = function () {
  return lastCall;
};

exports.shouldErrorOnNextCall = false;

exports.shouldFailOnNextCall = false;

exports.findArray = function (collectionName, searchTerms, projection, sortOrder) {
  lastCall = {
    collectionName: collectionName,
    searchTerms: searchTerms,
    projection: projection,
    sortOrder: sortOrder
  };

  if (!exports.shouldErrorOnNextCall) {
    var dummyData = [
      { name: "foo", loc: [1, 2] },
      { name: "bar", loc: [3, 4] }
    ];

    return Promise.resolve(dummyData);
  } else {
    return Promise.reject(new Error("findArray Oops")).finally(() => {
      exports.shouldErrorOnNextCall = false;
    });
  }
};

exports.findOne = function (collectionName, searchTerms, projection, sortOrder) {
  lastCall = {
    collectionName: collectionName,
    searchTerms: searchTerms,
    projection: projection,
    sortOrder: sortOrder
  };

  if (!exports.shouldErrorOnNextCall) {
    var dummyData = {
      loc: [1, 2],
      name: "1234",
      seq: 4321
    };

    return Promise.resolve(dummyData);
  } else {
    return Promise.reject(new Error("findOne Oops")).finally(() => {
      exports.shouldErrorOnNextCall = false;
    });
  }
};

exports.update = function (collectionName, searchTerms, updateOperation) {
  lastCall = {
    collectionName: collectionName,
    searchTerms: searchTerms,
    updateOperation: updateOperation
  };

  if (exports.shouldErrorOnNextCall) {
    return Promise.reject(new Error("update Oops")).finally(() => {
      exports.shouldErrorOnNextCall = false;
    });
  } else if (exports.shouldFailOnNextCall) {
    exports.shouldFailOnNextCall = false;
    return Promise.resolve({ acknowledged: true, matchedCount: 0, modifiedCount: 0 });
  } else {
    return Promise.resolve({ acknowledged: true, matchedCount: 1, modifiedCount: 1 });
  }
};

exports.remove = function (collectionName, searchTerms) {
  lastCall = {
    collectionName: collectionName,
    searchTerms: searchTerms
  };

  if (!exports.shouldErrorOnNextCall) {
    return Promise.resolve();
  } else {
    return Promise.reject(new Error("remove Oops")).finally(() => {
      exports.shouldErrorOnNextCall = false;
    });
  }
};

exports.insert = function (collectionName, insertOperation) {
  lastCall = {
    collectionName: collectionName,
    insertOperation: insertOperation
  };

  if (exports.shouldErrorOnNextCall) {
    return Promise.reject(new Error("insert Oops")).finally(() => {
      exports.shouldErrorOnNextCall = false;
    });
  } else if (exports.shouldFailOnNextCall) {
    exports.shouldFailOnNextCall = false;
    return Promise.resolve({ acknowledged: false, insertedId: null });
  } else {
    return Promise.resolve({ acknowledged: true, insertedId: "507f1f77bcf86cd799439011" });
  }
};
