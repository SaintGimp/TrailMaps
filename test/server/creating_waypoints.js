import { expect } from "chai";
import * as fakeDataService from "./fakeDataService.js";
import * as waypoints from "../../domain/waypoints.js";

waypoints.initialize(fakeDataService);

describe("Creating a waypoint", function () {
  var createResult;

  describe("when creating a new waypoint", function () {
    before(async function () {
      var options = {
        trailName: "pct",
        waypoint: {
          name: "new waypoint",
          loc: [1, 2]
        }
      };
      createResult = await waypoints.create(options);
    });

    it("should create the waypoint in the collection corresponding to the trail name", function () {
      expect(fakeDataService.getLastCall().containerName).to.equal("waypoints");
    });

    it("should create the waypoint with the specified attributes", function () {
      expect(fakeDataService.getLastCall().item.name).to.equal("new waypoint");
    });

    it("should set the sequence number for the waypoint", function () {
      expect(fakeDataService.getLastCall().item.seq).to.equal(1);
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
          loc: [1, 2]
        }
      };
      fakeDataService.state.shouldFailOnCreate = true;
      createResult = await waypoints.create(options);
    });

    it("should indicate failure", function () {
      expect(createResult).to.be.false;
    });
  });
});
