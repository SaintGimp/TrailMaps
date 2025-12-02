import { expect } from "chai";
import * as fakeDataService from "./fakeDataService.js";
import * as waypoints from "../../domain/waypoints.js";

waypoints.initialize(fakeDataService);

describe("Finding a waypoint by name", function () {
  var foundWaypoint;

  describe("when finding a waypoint", function () {
    before(async function () {
      var options = { trailName: "pct", name: "waypoint" };
      foundWaypoint = await waypoints.findByName(options);
    });

    it("should get a waypoint from the service", function () {
      expect(foundWaypoint).to.exist;
    });

    it("should get the waypoint from the collection corresponding to the trail name", function () {
      expect(fakeDataService.getLastCall().containerName).to.equal("waypoints");
    });

    it("should get a waypoint whos name starts with the search text", function () {
      const params = fakeDataService.getLastCall().querySpec.parameters;
      const nameParam = params.find((p) => p.name === "@name");
      expect(nameParam.value).to.equal("waypoint");
      expect(fakeDataService.getLastCall().querySpec.query).to.contain("STARTSWITH(c.name, @name, true)");
    });
  });
});

describe("Getting waypoint typeahead lists", function () {
  var foundWaypointNames;

  describe("when getting a typeahead list", function () {
    before(async function () {
      var options = { trailName: "pct", text: "foo" };
      foundWaypointNames = waypoints.getTypeaheadList(options);
    });

    it("should get waypoint names from the service", function () {
      expect(foundWaypointNames).to.exist;
    });

    it("should get the waypoint names from the collection corresponding to the trail name", function () {
      expect(fakeDataService.getLastCall().containerName).to.equal("waypoints");
    });

    it("should get all waypoints that contain the search text", function () {
      const params = fakeDataService.getLastCall().querySpec.parameters;
      const textParam = params.find((p) => p.name === "@text");
      expect(textParam.value).to.equal("foo");
      expect(fakeDataService.getLastCall().querySpec.query).to.contain("CONTAINS(c.name, @text, true)");
    });
  });
});
