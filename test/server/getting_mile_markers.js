/*jshint expr:true*/

var expect = require('chai').expect;
var fakeDataService = require('./fakeDataService');
var mileMarkers = require('../../domain/milemarkers')(fakeDataService);

describe('Finding mile markers by area', function() {
  var mileMarkerData;

  describe('when finding mile markers', function() {
    before(function(done){
      var options = {trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 5};
      mileMarkers.findByArea(options)
      .done(function(data) {
        mileMarkerData = data;
        done();
      });
    });

    it('should get mile marker data from the service', function() {
      expect(mileMarkerData).to.have.length(2);
    });

    it('should get data from the collection corresponding to the trail name', function() {
      expect(fakeDataService.getLastCall().collectionName).to.match(/^pct_milemarkers\d+$/);
    });

    it('should get data from the collection corresponding to the detail level', function() {
      expect(fakeDataService.getLastCall().collectionName).to.match(/.*5$/);
    });

    it('should get data for the specified geographic area', function() {
      expect(fakeDataService.getLastCall().searchTerms.loc.$within.$box[0][0]).to.equal(-125);
      expect(fakeDataService.getLastCall().searchTerms.loc.$within.$box[0][1]).to.equal(32);
      expect(fakeDataService.getLastCall().searchTerms.loc.$within.$box[1][0]).to.equal(-110);
      expect(fakeDataService.getLastCall().searchTerms.loc.$within.$box[1][1]).to.equal(50);
    });
  });

  describe('when requesting more than the maximum detail', function() {
    before(function(done){
      var options = {trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20};
      mileMarkers.findByArea(options)
      .done(function(data) {
        mileMarkerData = data;
        done();
      });
    });

    it('should get mile markers from the the collection corresponding to the maximum available detail level', function() {
      expect(fakeDataService.getLastCall().collectionName).to.match(/.*14$/);
    });
  });

  describe('when encountering an error', function() {
    var errorFromCall;

    before(function(done){
      fakeDataService.shouldErrorOnNextCall = true;
      var options = {trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20};
      mileMarkers.findByArea(options)
      .catch(function(err) {
        errorFromCall = err;
        done();
      });
    });

    it('should propagate the error', function() {
      expect(errorFromCall).to.exist;
    });
  });
});

describe('Finding a mile marker by value', function() {
  var foundMileMarker;

  describe('when finding a mile marker', function() {
    before(function(done){
      var options = { trailName: "pct", mile: 1234 };
      mileMarkers.findByValue(options)
      .done(function(mileMarker) {
        foundMileMarker = mileMarker;
        done();
      });
    });

    it('should get a mile marker from the service', function() {
      expect(foundMileMarker).to.exist;
    });

    it('should get the mile marker from the collection corresponding to the trail name', function() {
      expect(fakeDataService.getLastCall().collectionName).to.match(/^pct_milemarkers\d+$/);
    });

    it('should get the mile marker from the maximum detail level collection', function() {
      expect(fakeDataService.getLastCall().collectionName).to.match(/.*14$/);
    });

    it('should get the mile marker by value', function() {
      expect(fakeDataService.getLastCall().searchTerms.mile).to.equal(1234);
    });
  });
});