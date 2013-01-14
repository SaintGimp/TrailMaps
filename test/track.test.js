var should = require('should');
var tracks = require('../domain/tracks');

describe('Getting track data', function() {
  var track;

  before(function(done){
    track = tracks.load("./data/test.json", done);
  });

  describe('when requesting the entire track', function() {
    var data;

    before(function(){
      data = tracks.getTrackData({north: 33, south: 32, east: -116, west: -117, zoom: 15});
    });

    it('should return the entire track', function() {
      data.length.should.equal(10);
    });
  });
});