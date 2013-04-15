var should = require('should');
var fakeDataService = require('./fakeDataService');
var trails = require('../../domain/trails')(fakeDataService);

describe('Finding trail data by area', function() {
  var trailData;

  describe('when finding trail data', function() {
    before(function(done) {
      var options = {trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 5};
      trails.findByArea(options)
      .done(function(data) {
        trailData = data;
        done();
      });
    });

    it('should get trail data from the service', function() {
      should.exist(trailData);
    });

    it('should include track data', function() {
      trailData.track.should.have.length(2);
    });

    it('should include mile marker data', function() {
      trailData.mileMarkers.should.have.length(2);
    });
  });

  describe('when encountering an error', function() {
    var errorFromCall;

    before(function(done) {
      fakeDataService.shouldErrorOnNextCall = true;
      var options = {trailName: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20};
      trails.findByArea(options)
      .catch(function(err) {
        errorFromCall = err;
        done();
      });
    });

    it('should propagate the error', function() {
      should.exist(errorFromCall);
    });
  });
});