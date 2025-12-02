import { expect } from "chai";
import * as fakeDataService from "./fakeDataService.js";
import * as mileMarkers from "../../domain/mileMarkers.js";

mileMarkers.initialize(fakeDataService);

describe("Finding mile markers by area", function () {
  var mileMarkerData;

  describe("when finding mile markers", function () {
    before(async function () {
      var options = { trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 5 };
      mileMarkerData = await mileMarkers.findByArea(options);
    });

    it("should get mile marker data from the service", function () {
      expect(mileMarkerData).to.have.length(2);
    });

    it("should get data from the collection corresponding to the trail name", function () {
      expect(fakeDataService.getLastCall().containerName).to.equal("milemarkers");
    });

    it("should get data from the collection corresponding to the detail level", function () {
      const params = fakeDataService.getLastCall().querySpec.parameters;
      const detailLevelParam = params.find((p) => p.name === "@detailLevel");
      expect(detailLevelParam.value).to.equal(5);
    });

    it("should get data for the specified geographic area", function () {
      const params = fakeDataService.getLastCall().querySpec.parameters;
      // console.log("Params:", JSON.stringify(params, null, 2));
      const bboxParam = params.find((p) => p.name === "@polygon");
      const coords = bboxParam.value.coordinates[0];
      // Polygon coordinates: [[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]]
      expect(coords[0][0]).to.equal(-125); // west
      expect(coords[0][1]).to.equal(32); // south
      expect(coords[2][0]).to.equal(-110); // east
      expect(coords[2][1]).to.equal(50); // north
    });
  });

  describe("when requesting more than the maximum detail", function () {
    before(async function () {
      var options = { trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20 };
      mileMarkerData = await mileMarkers.findByArea(options);
    });

    it("should get mile markers from the the collection corresponding to the maximum available detail level", function () {
      const params = fakeDataService.getLastCall().querySpec.parameters;
      const detailLevelParam = params.find((p) => p.name === "@detailLevel");
      expect(detailLevelParam.value).to.equal(14);
    });
  });

  describe("when encountering an error", function () {
    var errorFromCall;

    before(async function () {
      fakeDataService.state.shouldErrorOnNextCall = true;
      var options = { trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20 };
      try {
        await mileMarkers.findByArea(options);
      } catch (err) {
        errorFromCall = err;
      }
    });

    it("should propagate the error", function () {
      expect(errorFromCall).to.exist;
    });
  });
});

describe("Finding a mile marker by value", function () {
  var foundMileMarker;

  describe("when finding a mile marker", function () {
    before(async function () {
      var options = { trailName: "pct", mile: 1234 };
      foundMileMarker = await mileMarkers.findByValue(options);
    });

    it("should get a mile marker from the service", function () {
      expect(foundMileMarker).to.exist;
    });

    it("should get the mile marker from the collection corresponding to the trail name", function () {
      expect(fakeDataService.getLastCall().containerName).to.equal("milemarkers");
    });

    it("should get the mile marker from the maximum detail level collection", function () {
      const params = fakeDataService.getLastCall().querySpec.parameters;
      const detailLevelParam = params.find((p) => p.name === "@detailLevel");
      expect(detailLevelParam.value).to.equal(14);
    });

    it("should get the mile marker by value", function () {
      const params = fakeDataService.getLastCall().querySpec.parameters;
      const mileParam = params.find((p) => p.name === "@mile");
      expect(mileParam.value).to.equal(1234);
    });
  });
});
