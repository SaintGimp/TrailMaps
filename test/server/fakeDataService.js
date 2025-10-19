let lastCall;

export function getLastCall() {
  return lastCall;
}

// Make these mutable state objects that tests can modify
export const state = {
  shouldErrorOnNextCall: false,
  shouldFailOnNextCall: false
};

export function findArray(collectionName, searchTerms, projection, sortOrder) {
  lastCall = {
    collectionName: collectionName,
    searchTerms: searchTerms,
    projection: projection,
    sortOrder: sortOrder
  };

  if (!state.shouldErrorOnNextCall) {
    var dummyData = [
      { name: "foo", loc: [1, 2] },
      { name: "bar", loc: [3, 4] }
    ];

    return Promise.resolve(dummyData);
  } else {
    return Promise.reject(new Error("findArray Oops")).finally(() => {
      state.shouldErrorOnNextCall = false;
    });
  }
}

export function findOne(collectionName, searchTerms, projection, sortOrder) {
  lastCall = {
    collectionName: collectionName,
    searchTerms: searchTerms,
    projection: projection,
    sortOrder: sortOrder
  };

  if (!state.shouldErrorOnNextCall) {
    var dummyData = {
      loc: [1, 2],
      name: "1234",
      seq: 4321
    };

    return Promise.resolve(dummyData);
  } else {
    return Promise.reject(new Error("findOne Oops")).finally(() => {
      state.shouldErrorOnNextCall = false;
    });
  }
}

export function update(collectionName, searchTerms, updateOperation) {
  lastCall = {
    collectionName: collectionName,
    searchTerms: searchTerms,
    updateOperation: updateOperation
  };

  if (state.shouldErrorOnNextCall) {
    return Promise.reject(new Error("update Oops")).finally(() => {
      state.shouldErrorOnNextCall = false;
    });
  } else if (state.shouldFailOnNextCall) {
    state.shouldFailOnNextCall = false;
    return Promise.resolve({ acknowledged: true, matchedCount: 0, modifiedCount: 0 });
  } else {
    return Promise.resolve({ acknowledged: true, matchedCount: 1, modifiedCount: 1 });
  }
}

export function remove(collectionName, searchTerms) {
  lastCall = {
    collectionName: collectionName,
    searchTerms: searchTerms
  };

  if (!state.shouldErrorOnNextCall) {
    return Promise.resolve();
  } else {
    return Promise.reject(new Error("remove Oops")).finally(() => {
      state.shouldErrorOnNextCall = false;
    });
  }
}

export function insert(collectionName, insertOperation) {
  lastCall = {
    collectionName: collectionName,
    insertOperation: insertOperation
  };

  if (state.shouldErrorOnNextCall) {
    return Promise.reject(new Error("insert Oops")).finally(() => {
      state.shouldErrorOnNextCall = false;
    });
  } else if (state.shouldFailOnNextCall) {
    state.shouldFailOnNextCall = false;
    return Promise.resolve({ acknowledged: false, insertedId: null });
  } else {
    return Promise.resolve({ acknowledged: true, insertedId: "507f1f77bcf86cd799439011" });
  }
}

export function initialize() {
  // No-op for compatibility
}

export default {
  getLastCall,
  state,
  findArray,
  findOne,
  update,
  remove,
  insert,
  initialize
};
