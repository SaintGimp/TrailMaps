import { expect } from "chai";
import { app } from "../../server.js";
import * as dataService from "../../domain/dataService.js";
import http from "http";

describe("Compression", function () {
  let server;

  before(async function () {
    // Connect to Cosmos DB before starting server
    await dataService.connect();
    // Start HTTP server on random port
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
  });

  after(async function () {
    // Close HTTP server
    await new Promise((resolve) => {
      server.close(resolve);
    });
    // Close Cosmos DB connection to allow process to exit
    await dataService.close();
  });

  it("should compress responses with gzip", function (done) {
    // Test compression on the login page (no auth required)
    const options = {
      hostname: "localhost",
      port: server.address().port,
      path: "/login",
      headers: {
        "Accept-Encoding": "gzip"
      }
    };

    http.get(options, (res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.headers["content-encoding"]).to.equal("gzip");
      done();
    });
  });
});
