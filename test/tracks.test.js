var should = require('should');
var fakeDataService = require('./fakeDataService');
var tracks = require('../domain/tracks')(fakeDataService);

describe('Getting track data', function() {
  var trackData;

  describe('when requesting track data', function() {
    before(function(done){
      var options = {name: "pct", north: 50, south: 32, east: -110, west: -125, zoom: 5};
      tracks.getData(options, function(err, data) {
        trackData = data;
        done();
      });
    });

    it('should get track data from the service', function() {
      trackData.should.have.length(2);
    });

    it('should get data from the collection corresponding to the trail name', function() {
      fakeDataService.getLastCall().collectionName.should.match(/pct.*/);
    });

    it('should get data from the collection corresponding to the zoom level', function() {
      fakeDataService.getLastCall().collectionName.should.match(/.*5/);
    });

    it('should get data for the specified geographic area', function() {
      fakeDataService.getLastCall().searchTerms.loc.$within.$box[0][0].should.equal(-125);
      fakeDataService.getLastCall().searchTerms.loc.$within.$box[0][1].should.equal(32);
      fakeDataService.getLastCall().searchTerms.loc.$within.$box[1][0].should.equal(-110);
      fakeDataService.getLastCall().searchTerms.loc.$within.$box[1][1].should.equal(50);
    });
  });

  describe('when requesting more than the maximum zoom', function() {
    before(function(done){
      var options = {name: "pct", north: 50, south: 32, east: -110, west: -125, zoom: 20};
      tracks.getData(options, function(err, data) {
        trackData = data;
        done();
      });
    });

    it('should get data from the the collection corresponding to the maximum available zoom level', function() {
      fakeDataService.getLastCall().collectionName.should.match(/.*16/);
    });
  });

  describe('when encountering an error', function() {
    var errorFromCall;

    before(function(done){
      fakeDataService.shouldErrorOnNextCall = true;
      var options = {name: "pct", north: 50, south: 32, east: -110, west: -125, zoom: 20};
      tracks.getData(options, function(err, data) {
        errorFromCall = err;
        done();
      });
    });

    it('should get data from the the collection corresponding to the maximum available zoom level', function() {
      should.exist(errorFromCall);
    });
  });
});