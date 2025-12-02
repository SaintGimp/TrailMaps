import { expect } from "chai";
import * as fakeDataService from "./fakeDataService.js";
import * as waypoints from "../../domain/waypoints.js";

waypoints.initialize(fakeDataService);

describe("Deleting a waypoint", function () {
  describe("when deleting a waypoint by id", function () {
    before(async function () {
      var options = { trailName: "pct", id: "518203e00174652e7a000003" };
      await waypoints.deleteById(options);
    });

    it("should delete the waypoint from the collection corresponding to the trail name", function () {
      expect(fakeDataService.getLastCall().containerName).to.equal("waypoints");
    });

    it("should delete the waypoint with the corresponding id", function () {
      expect(fakeDataService.getLastCall().id).to.equal("518203e00174652e7a000003");
    });
  });
});
