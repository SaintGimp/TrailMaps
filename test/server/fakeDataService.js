import { ObjectId } from "mongodb";

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
      { _id: new ObjectId("507f1f77bcf86cd799439011"), name: "foo", loc: [1, 2] },
      { _id: new ObjectId("507f1f77bcf86cd799439012"), name: "bar", loc: [3, 4] }
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
      _id: new ObjectId("507f1f77bcf86cd799439011"),
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
    return Promise.resolve({
      acknowledged: true,
      matchedCount: 0,
      modifiedCount: 0,
      upsertedCount: 0,
      upsertedId: null
    });
  } else {
    return Promise.resolve({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null
    });
  }
}

export function remove(collectionName, searchTerms) {
  lastCall = {
    collectionName: collectionName,
    searchTerms: searchTerms
  };

  if (!state.shouldErrorOnNextCall) {
    return Promise.resolve({ acknowledged: true, deletedCount: 1 });
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

export async function connect() {
  return Promise.resolve();
}

export async function close() {
  return Promise.resolve();
}

export async function collection(_name) {
  return Promise.resolve({
    find: () => ({ limit: () => ({ sort: () => ({ toArray: () => Promise.resolve([]) }) }) }),
    findOne: () => Promise.resolve(null),
    updateOne: () => Promise.resolve({ acknowledged: true, matchedCount: 0, modifiedCount: 0 }),
    deleteMany: () => Promise.resolve({ acknowledged: true, deletedCount: 0 }),
    insertOne: () => Promise.resolve({ acknowledged: true, insertedId: "fake-id" })
  });
}

export async function collections() {
  return Promise.resolve([]);
}

export default {
  getLastCall,
  state,
  findArray,
  findOne,
  update,
  remove,
  insert,
  initialize,
  connect,
  close,
  collection,
  collections
};
