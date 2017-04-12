var expect = require("chai").expect;
var fakeDataService = require("./fakeDataService");
var waypoints = require("../../domain/waypoints")(fakeDataService);

describe("Updating a waypoint", function() {
  var updateResult;

  describe("when updating a waypoint by id", function() {
    before(async function(){
      var options = { trailName: "pct", id: "518203e00174652e7a000003", name: "updated" };
      updateResult = await waypoints.updateById(options);
    });

    it("should update the waypoint in the collection corresponding to the trail name", function() {
      expect(fakeDataService.getLastCall().collectionName).to.equal("pct_waypoints");
    });

    it("should update the waypoint having the given id", function() {
      expect(fakeDataService.getLastCall().searchTerms._id.toHexString()).to.equal("518203e00174652e7a000003");
    });

    it("should update the waypoint with the new nane", function() {
      expect(fakeDataService.getLastCall().updateOperation.$set.name).to.equal("updated");
    });

    it("should indicate success", function() {
      expect(updateResult).to.be.true;
    });
  });

  describe("when updating a nonexistent waypoint", function() {
    before(async function(){
      var options = { trailName: "pct", id: "518203e00174652e7a000003", name: "updated" };
      fakeDataService.shouldFailOnNextCall = true;
      updateResult = await waypoints.updateById(options);
    });

    it("should indicate failure", function() {
      expect(updateResult).to.be.false;
    });
  });
});