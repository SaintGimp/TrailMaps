import { CosmosClient } from "@azure/cosmos";
import https from "https";

let client = null;
let database = null;

export async function connect() {
  if (client) {
    return database;
  }

  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    throw new Error("Cosmos DB endpoint or key not found in environment variables.");
  }

  console.log("Connecting to Cosmos DB at " + endpoint);

  /** @type {import("@azure/cosmos").CosmosClientOptions} */
  const clientOptions = {
    endpoint,
    key,
    connectionPolicy: {
      retryOptions: {
        maxRetryAttemptCount: 100,
        maxWaitTimeInSeconds: 5 * 60
      }
    }
  };

  if (endpoint.includes("localhost")) {
    // Node on Windows doesn't check the trusted root store so we have to disable TLS verification.
    // Disable TLS verification only for this client (for local emulator), not globally.
    clientOptions.agent = new https.Agent({ rejectUnauthorized: false });
  }

  client = new CosmosClient(clientOptions);

  const { database: db } = await client.databases.createIfNotExists({ id: "trailmaps" });
  database = db;

  // Create containers with partition key /trailName
  const containers = ["tracks", "milemarkers", "waypoints"];
  for (const containerId of containers) {
    const containerDef = {
      id: containerId,
      partitionKey: { paths: ["/trailName"] },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [{ path: "/*" }, { path: "/loc/*", indexes: [{ kind: "Spatial", dataType: "Point" }] }]
      }
    };
    // @ts-ignore
    await database.containers.createIfNotExists(containerDef);
  }

  return database;
}

export function container(containerName) {
  if (!database) {
    throw new Error("Database not initialized. Call connect() first.");
  }
  return database.container(containerName);
}

export async function query(containerName, querySpec) {
  const { resources } = await container(containerName).items.query(querySpec).fetchAll();
  return resources;
}

export async function create(containerName, item) {
  const { resource } = await container(containerName).items.create(item);
  return resource;
}

export async function replace(containerName, id, item) {
  const { resource } = await container(containerName).item(id, item.trailName).replace(item);
  return resource;
}

export async function deleteItem(containerName, id, partitionKey) {
  await container(containerName).item(id, partitionKey).delete();
}

export async function close() {
  if (client) {
    client.dispose();
    client = null;
    database = null;
  }
}

export default {
  connect,
  container,
  query,
  create,
  replace,
  deleteItem,
  close
};
