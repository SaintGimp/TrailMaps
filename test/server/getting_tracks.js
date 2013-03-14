var should = require('should');
var fakeDataService = require('./fakeDataService');
var tracks = require('../../domain/tracks')(fakeDataService);

describe('Finding track data by area', function() {
  var trackData;

  describe('when finding track data', function() {
    before(function(done){
      var options = {trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 5};
      tracks.findByArea(options, function(err, data) {
        trackData = data;
        done();
      });
    });

    it('should get track data from the service', function() {
      trackData.should.have.length(2);
    });

    it('should get data from the collection corresponding to the trail name', function() {
      fakeDataService.getLastCall().collectionName.should.match(/^pct_track\d+$/);
    });

    it('should get data from the collection corresponding to the detail level', function() {
      fakeDataService.getLastCall().collectionName.should.match(/.*5$/);
    });

    it('should get data for the specified geographic area', function() {
      fakeDataService.getLastCall().searchTerms.loc.$within.$box[0][0].should.equal(-125);
      fakeDataService.getLastCall().searchTerms.loc.$within.$box[0][1].should.equal(32);
      fakeDataService.getLastCall().searchTerms.loc.$within.$box[1][0].should.equal(-110);
      fakeDataService.getLastCall().searchTerms.loc.$within.$box[1][1].should.equal(50);
    });
  });

  describe('when requesting more than the maximum detail', function() {
    before(function(done){
      var options = {trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20};
      tracks.findByArea(options, function(err, data) {
        trackData = data;
        done();
      });
    });

    it('should get data from the the collection corresponding to the maximum available detail level', function() {
      fakeDataService.getLastCall().collectionName.should.match(/.*16$/);
    });
  });

  describe('when encountering an error', function() {
    var errorFromCall;

    before(function(done){
      fakeDataService.shouldErrorOnNextCall = true;
      var options = {trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20};
      tracks.findByArea(options, function(err, data) {
        errorFromCall = err;
        done();
      });
    });

    it('should propagate the error', function() {
      should.exist(errorFromCall);
    });
  });
});