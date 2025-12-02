import { expect } from "chai";
import * as fakeDataService from "./fakeDataService.js";
import * as tracks from "../../domain/tracks.js";

tracks.initialize(fakeDataService);

describe("Finding track data by area", function () {
  var trackData;

  describe("when finding track data", function () {
    before(async function () {
      var options = { trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 5 };
      trackData = await tracks.findByArea(options);
    });

    it("should get track data from the service", function () {
      expect(trackData).to.have.length(2);
    });

    it("should get data from the collection corresponding to the trail name", function () {
      expect(fakeDataService.getLastCall().collectionName).to.match(/^pct_track\d+$/);
    });

    it("should get data from the collection corresponding to the detail level", function () {
      expect(fakeDataService.getLastCall().collectionName).to.match(/.*5$/);
    });

    it("should get data for the specified geographic area", function () {
      expect(fakeDataService.getLastCall().searchTerms.loc.$geoWithin.$box[0][0]).to.equal(-125);
      expect(fakeDataService.getLastCall().searchTerms.loc.$geoWithin.$box[0][1]).to.equal(32);
      expect(fakeDataService.getLastCall().searchTerms.loc.$geoWithin.$box[1][0]).to.equal(-110);
      expect(fakeDataService.getLastCall().searchTerms.loc.$geoWithin.$box[1][1]).to.equal(50);
    });
  });

  describe("when requesting more than the maximum detail", function () {
    before(async function () {
      var options = { trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20 };
      trackData = await tracks.findByArea(options);
    });

    it("should get data from the the collection corresponding to the maximum available detail level", function () {
      expect(fakeDataService.getLastCall().collectionName).to.match(/.*16$/);
    });
  });

  describe("when encountering an error", function () {
    var errorFromCall;

    before(async function () {
      fakeDataService.state.shouldErrorOnNextCall = true;
      var options = { trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20 };
      try {
        await tracks.findByArea(options);
      } catch (err) {
        errorFromCall = err;
      }
    });

    it("should propagate the error", function () {
      expect(errorFromCall).to.exist;
    });
  });
});
