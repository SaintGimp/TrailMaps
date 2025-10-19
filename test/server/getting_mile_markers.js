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
      expect(fakeDataService.getLastCall().collectionName).to.match(/^pct_milemarkers\d+$/);
    });

    it("should get data from the collection corresponding to the detail level", function () {
      expect(fakeDataService.getLastCall().collectionName).to.match(/.*5$/);
    });

    it("should get data for the specified geographic area", function () {
      expect(fakeDataService.getLastCall().searchTerms.loc.$within.$box[0][0]).to.equal(-125);
      expect(fakeDataService.getLastCall().searchTerms.loc.$within.$box[0][1]).to.equal(32);
      expect(fakeDataService.getLastCall().searchTerms.loc.$within.$box[1][0]).to.equal(-110);
      expect(fakeDataService.getLastCall().searchTerms.loc.$within.$box[1][1]).to.equal(50);
    });
  });

  describe("when requesting more than the maximum detail", function () {
    before(async function () {
      var options = { trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20 };
      mileMarkerData = await mileMarkers.findByArea(options);
    });

    it("should get mile markers from the the collection corresponding to the maximum available detail level", function () {
      expect(fakeDataService.getLastCall().collectionName).to.match(/.*14$/);
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
      expect(fakeDataService.getLastCall().collectionName).to.match(/^pct_milemarkers\d+$/);
    });

    it("should get the mile marker from the maximum detail level collection", function () {
      expect(fakeDataService.getLastCall().collectionName).to.match(/.*14$/);
    });

    it("should get the mile marker by value", function () {
      expect(fakeDataService.getLastCall().searchTerms.mile).to.equal(1234);
    });
  });
});
