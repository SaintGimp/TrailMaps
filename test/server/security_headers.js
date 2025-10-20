import { expect } from "chai";
import { app } from "../../server.js";
import http from "http";

describe("Security Headers", function () {
  let server;

  before(function (done) {
    server = app.listen(0, done); // Random available port
  });

  after(function (done) {
    server.close(done);
  });

  it("should include X-Content-Type-Options header", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      expect(res.headers["x-content-type-options"]).to.equal("nosniff");
      done();
    });
  });

  it("should include X-Frame-Options header", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      expect(res.headers["x-frame-options"]).to.equal("DENY");
      done();
    });
  });

  it("should include Content-Security-Policy header", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      expect(res.headers["content-security-policy"]).to.exist;
      expect(res.headers["content-security-policy"]).to.include("default-src 'self'");
      done();
    });
  });

  it("should not include X-Powered-By header", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      expect(res.headers["x-powered-by"]).to.not.exist;
      done();
    });
  });

  it("should include X-XSS-Protection header", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      // Helmet 8.x sets this to "0" by default when CSP is present
      expect(res.headers["x-xss-protection"]).to.exist;
      done();
    });
  });

  it("should include Referrer-Policy header", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      expect(res.headers["referrer-policy"]).to.equal("strict-origin-when-cross-origin");
      done();
    });
  });

  it("should include X-DNS-Prefetch-Control header", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      expect(res.headers["x-dns-prefetch-control"]).to.equal("off");
      done();
    });
  });

  it("should allow scripts from self", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      const csp = res.headers["content-security-policy"];
      expect(csp).to.include("script-src 'self'");
      done();
    });
  });

  it("should allow scripts from Bootstrap CDN", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      const csp = res.headers["content-security-policy"];
      expect(csp).to.include("https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/");
      done();
    });
  });

  it("should allow scripts from Azure Maps", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      const csp = res.headers["content-security-policy"];
      expect(csp).to.include("https://atlas.microsoft.com/sdk/javascript/");
      done();
    });
  });

  it("should allow scripts from Google Maps", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      const csp = res.headers["content-security-policy"];
      expect(csp).to.include("https://maps.googleapis.com");
      done();
    });
  });

  it("should allow scripts from HERE Maps", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      const csp = res.headers["content-security-policy"];
      expect(csp).to.include("https://js.api.here.com");
      done();
    });
  });

  it("should restrict frame embedding", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      const csp = res.headers["content-security-policy"];
      expect(csp).to.include("frame-src 'none'");
      done();
    });
  });

  it("should restrict object embedding", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      const csp = res.headers["content-security-policy"];
      expect(csp).to.include("object-src 'none'");
      done();
    });
  });

  it("should restrict base URI", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      const csp = res.headers["content-security-policy"];
      expect(csp).to.include("base-uri 'self'");
      done();
    });
  });

  it("should restrict form submissions", function (done) {
    http.get(`http://localhost:${server.address().port}/`, (res) => {
      const csp = res.headers["content-security-policy"];
      expect(csp).to.include("form-action 'self'");
      done();
    });
  });

  it("should include CSP nonce for inline scripts", function (done) {
    http.get(`http://localhost:${server.address().port}/trails/pct/maps/azure`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        // Check that HTML contains script with nonce attribute
        expect(data).to.match(/script[^>]*nonce="[^"]+"/);
        // Check that CSP header contains nonce pattern
        const csp = res.headers["content-security-policy"];
        expect(csp).to.match(/'nonce-[A-Za-z0-9+/=]+'/);
        done();
      });
    });
  });
});
