var should = require('should');
var tracks = require('../domain/tracks');

describe('Getting track data', function() {
  var trackData;

  describe('when requesting the entire track at minimum zoom', function() {
    before(function(done){
      var options = {name: "pct", north: 50, south: 32, east: -110, west: -125, zoom: 1};
      tracks.getData(options, function(err, data) {
        trackData = data;
        done();
      });
    });

    it('should get the entire minimum zoom track', function() {
      trackData.should.have.length(7);
    });
  });

  describe('when requesting only part of the track at maximum zoom', function() {
    before(function(done){
      var options = {name: "pct", north: 32.590200, south: 32.590100, east: -116.467300, west: -116.467600, zoom: 16};
      tracks.getData(options, function(err, data) {
        should.not.exist(err);
        should.exist(data);
        trackData = data;
        done();
      });
    });

    it('should get part of the track', function() {
      trackData.should.have.length(2);
    });

    it('should filter out east/west data', function() {
      trackData.forEach(function(point) {
        point.loc[0].should.be.within(-116.467600, -116.467300);
      });
    });

    it('should filter out north/south data', function() {
      trackData.forEach(function(point) {
        point.loc[1].should.be.within(32.590100, 32.590200);
      });
    });
  });

  describe('when requesting more than the maximum zoom', function() {
    var maximumZoomData, moreThanMaximumZoomData;

    before(function(done){
      var options = {name: "pct", north: 32.590200, south: 32.590100, east: -116.467300, west: -116.467600, zoom: 16};
      tracks.getData(options, function(err, data) {
        maximumZoomData = data;
        options.zoom = 20;
        tracks.getData(options, function(err, data) {
          moreThanMaximumZoomData = data;
          done();
        });
      });
    });

    it('should get the maximum zoom data', function() {
      moreThanMaximumZoomData.should.eql(maximumZoomData);
    });
  });

  describe('when requesting track data multiple times', function() {
    var secondTrackData;

    before(function(done){
      var options = {name: "pct", north: 50, south: 32, east: -110, west: -125, zoom: 1};
      tracks.getData(options, function(err, data) {
        trackData = data;
        tracks.getData(options, function(err, data) {
          secondTrackData = data;
          done();
        });
      });
    });

    it('should return data each time', function() {
      trackData.should.have.length(7);
      secondTrackData.should.have.length(7);
    });

    it('should connect to the database only once', function() {
      tracks.numberOfConnections.should.equal(1);
    });
  });
});