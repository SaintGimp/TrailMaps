var should = require('should');
var tracks = require('../domain/tracks');

describe('Getting track data', function() {
  var trackData;

  describe('when requesting the entire track', function() {
    before(function(done){
      var options = {name: "test", north: 33, south: 32, east: -116, west: -117, zoom: 15};
      tracks.getData(options, function(err, data) {
        trackData = data;
        done();
      });
    });

    it('should return the entire track', function() {
      trackData.should.have.length(10);
    });
  });

  describe('when requesting only part of the track', function() {
    before(function(done){
      var options = {name: "test", north: 32.590200, south: 32.590100, east: -116.467300, west: -116.467600, zoom: 15};
      tracks.getData(options, function(err, data) {
        trackData = data;
        done();
      });
    });

    it('should return part of the track', function() {
      trackData.should.have.length(2);
    });

    it('should filter out north/south data', function() {
      trackData.forEach(function(point) {
        point.lat.should.be.within(32.590100, 32.590200);
      });
    });

    it('should filter out east/west data', function() {
      trackData.forEach(function(point) {
        point.lon.should.be.within(-116.467600, -116.467300);
      });
    });
  });

  describe('when requesting data for a zoom level', function() {
    before(function(done){
      var options = {name: "test", north: 33, south: 32, east: -116, west: -117, zoom: 13};
      tracks.getData(options, function(err, data) {
        trackData = data;
        done();
      });
    });

    it('should return part of the track', function() {
      trackData.should.have.length(3);
    });

    it('should filter out higher zoom level data', function() {
      trackData.forEach(function(point) {
        point.minZoom.should.not.be.above(13);
      });
    });
  });

  describe('when requesting track data multiple times', function() {
    var secondTrackData;

    before(function(done){
      var options = {name: "test", north: 33, south: 32, east: -116, west: -117, zoom: 15};
      tracks.getData(options, function(err, data) {
        trackData = data;
        tracks.getData(options, function(err, data) {
          secondTrackData = data;
          done();
        });
      });
    });

    it('should return data each time', function() {
      trackData.should.have.length(10);
      secondTrackData.should.have.length(10);
    });

    it('should load the track from disk only once', function() {
      tracks.numberOfTracksLoaded.should.equal(1);
    });
  });
});