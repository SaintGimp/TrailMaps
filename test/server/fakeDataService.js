let lastCall;

export function getLastCall() {
  return lastCall;
}

// Make these mutable state objects that tests can modify
export const state = {
  shouldErrorOnNextCall: false,
  shouldFailOnNextCall: false,
  shouldFailOnCreate: false
};

export function query(containerName, querySpec) {
  lastCall = {
    containerName: containerName,
    querySpec: querySpec
  };

  if (state.shouldErrorOnNextCall) {
    return Promise.reject(new Error("query Oops")).finally(() => {
      state.shouldErrorOnNextCall = false;
    });
  } else if (state.shouldFailOnNextCall) {
    state.shouldFailOnNextCall = false;
    return Promise.resolve([]);
  } else {
    var dummyData = [
      { id: "507f1f77bcf86cd799439011", name: "foo", loc: { type: "Point", coordinates: [1, 2] }, seq: 1, dist: 10 },
      { id: "507f1f77bcf86cd799439012", name: "bar", loc: { type: "Point", coordinates: [3, 4] }, seq: 2, dist: 20 }
    ];

    return Promise.resolve(dummyData);
  }
}

export function create(containerName, item) {
  lastCall = {
    containerName: containerName,
    item: item
  };

  if (state.shouldErrorOnNextCall) {
    return Promise.reject(new Error("create Oops")).finally(() => {
      state.shouldErrorOnNextCall = false;
    });
  } else if (state.shouldFailOnNextCall || state.shouldFailOnCreate) {
    state.shouldFailOnNextCall = false;
    state.shouldFailOnCreate = false;
    return Promise.resolve(null);
  } else {
    return Promise.resolve({ ...item, id: "507f1f77bcf86cd799439011" });
  }
}

export function replace(containerName, id, item) {
  lastCall = {
    containerName: containerName,
    id: id,
    item: item
  };

  if (state.shouldErrorOnNextCall) {
    return Promise.reject(new Error("replace Oops")).finally(() => {
      state.shouldErrorOnNextCall = false;
    });
  } else if (state.shouldFailOnNextCall) {
    state.shouldFailOnNextCall = false;
    return Promise.resolve(null);
  } else {
    return Promise.resolve({ ...item, id: id });
  }
}

export function deleteItem(containerName, id, partitionKey) {
  lastCall = {
    containerName: containerName,
    id: id,
    partitionKey: partitionKey
  };

  if (!state.shouldErrorOnNextCall) {
    return Promise.resolve();
  } else {
    return Promise.reject(new Error("deleteItem Oops")).finally(() => {
      state.shouldErrorOnNextCall = false;
    });
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

export function container(_containerName) {
  return {
    items: {
      query: () => ({ fetchAll: () => Promise.resolve({ resources: [] }) }),
      create: () => Promise.resolve({ resource: { id: "fake-id" } })
    },
    item: () => ({
      replace: () => Promise.resolve({ resource: { id: "fake-id" } }),
      delete: () => Promise.resolve()
    })
  };
}

export function reset() {
  return Promise.resolve();
}

export default {
  getLastCall,
  state,
  query,
  create,
  replace,
  deleteItem,
  initialize,
  connect,
  close,
  container,
  reset
};
