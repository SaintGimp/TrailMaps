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
    const options = {
      hostname: "localhost",
      port: server.address().port,
      path: "/",
      headers: {
        "Accept-Encoding": "gzip"
      }
    };

    http.get(options, (_res) => {
      // Redirects (302) might not be compressed if they have no body.
      // Let's check a 200 OK response, e.g., a static file or a page.
      // The root path / redirects to /trails/pct/maps/azure usually?
      // Let's try fetching a known page or static asset if possible.
      // Based on previous tests, /trails/pct/maps/azure returns 200.

      const options2 = {
        hostname: "localhost",
        port: server.address().port,
        path: "/trails/pct/maps/azure",
        headers: {
          "Accept-Encoding": "gzip"
        }
      };

      http.get(options2, (res2) => {
        expect(res2.statusCode).to.equal(200);
        expect(res2.headers["content-encoding"]).to.equal("gzip");
        done();
      });
    });
  });
});
