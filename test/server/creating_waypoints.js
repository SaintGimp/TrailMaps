var expect = require("chai").expect;
var fakeDataService = require("./fakeDataService");
var waypoints = require("../../domain/waypoints")(fakeDataService);

describe("Creating a waypoint", function () {
  var createResult;

  describe("when creating a new waypoint", function () {
    before(async function () {
      var options = {
        trailName: "pct",
        waypoint: {
          name: "new waypoint",
          location: [1, 2]
        }
      };
      createResult = await waypoints.create(options);
    });

    it("should create the waypoint in the collection corresponding to the trail name", function () {
      expect(fakeDataService.getLastCall().collectionName).to.equal("pct_waypoints");
    });

    it("should create the waypoint with the specified attributes", function () {
      expect(fakeDataService.getLastCall().insertOperation.name).to.equal("new waypoint");
    });

    it("should set the sequence number for the waypoint", function () {
      expect(fakeDataService.getLastCall().insertOperation.seq).to.equal(4321);
    });

    it("should indicate success", function () {
      expect(createResult).to.be.true;
    });
  });

  describe("when failing to create a waypoint", function () {
    before(async function () {
      var options = {
        trailName: "pct",
        waypoint: {
          name: "new waypoint",
          location: [1, 2]
        }
      };
      fakeDataService.shouldFailOnNextCall = true;
      createResult = await waypoints.create(options);
    });

    it("should indicate failure", function () {
      expect(createResult).to.be.false;
    });
  });
});
