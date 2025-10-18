var expect = require("chai").expect;
var fakeDataService = require("./fakeDataService");
var trails = require("../../domain/trails")(fakeDataService);

describe("Finding trail data by area", function () {
  var trailData;

  describe("when finding trail data", function () {
    before(async function () {
      var options = { trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 5 };
      trailData = await trails.findByArea(options);
    });

    it("should get trail data from the service", function () {
      expect(trailData).to.exist;
    });

    it("should include track data", function () {
      expect(trailData.track).to.have.length(2);
    });

    it("should include mile marker data", function () {
      expect(trailData.mileMarkers).to.have.length(2);
    });
  });

  describe("when encountering an error", function () {
    var errorFromCall;

    before(async function () {
      fakeDataService.shouldErrorOnNextCall = true;
      var options = { trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20 };
      try {
        await trails.findByArea(options);
      } catch (err) {
        errorFromCall = err;
      }
    });

    it("should propagate the error", function () {
      expect(errorFromCall).to.exist;
    });
  });
});
