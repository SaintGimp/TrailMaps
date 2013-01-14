var should = require('should');
var track = require('../domain/track');

describe('Getting track data', function() {
  var data;

  before(function(done){
    track.load("./data/test.json", done);
  });

  describe('when requesting the entire track', function() {
    before(function(){
      data = track.getPoints({north: 33, south: 32, east: -116, west: -117, zoom: 15});
    });

    it('should return the entire track', function() {
      data.length.should.equal(10);
    });
  });

  describe('when requesting only part of the track', function() {
    before(function(){
      data = track.getPoints({north: 32.590200, south: 32.590100, east: -116.467300, west: -116.467600, zoom: 15});
    });

    it('should return only part of the track', function() {
      data.length.should.equal(2);
    });

    it('should filter out north/south data', function() {
      data.forEach(function(point){
        point.lat.should.be.within(32.590100, 32.590200);
      });
    });

    it('should filter out east/west data', function() {
      data.forEach(function(point){
        point.lon.should.be.within(-116.467600, -116.467300);
      });
    });
  });
});