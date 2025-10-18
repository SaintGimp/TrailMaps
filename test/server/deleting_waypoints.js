var expect = require("chai").expect;
var fakeDataService = require("./fakeDataService");
var waypoints = require("../../domain/waypoints")(fakeDataService);

describe("Deleting a waypoint", function () {
  describe("when deleting a waypoint by id", function () {
    before(async function () {
      var options = { trailName: "pct", id: "518203e00174652e7a000003" };
      await waypoints.deleteById(options);
    });

    it("should delete the waypoint from the collection corresponding to the trail name", function () {
      expect(fakeDataService.getLastCall().collectionName).to.equal("pct_waypoints");
    });

    it("should delete the waypoint with the corresponding id", function () {
      expect(fakeDataService.getLastCall().searchTerms._id.toHexString()).to.equal("518203e00174652e7a000003");
    });
  });
});
