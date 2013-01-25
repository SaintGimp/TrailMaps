var should = require('should');
var fakeDataService = require('./fakeDataService');
var waypoints = require('../domain/waypoints')(fakeDataService);

describe('Getting waypoint data', function() {
  var waypointData;

  describe('when requesting waypoint data', function() {
    before(function(done){
      var options = {name: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 5};
      waypoints.getData(options, function(err, data) {
        waypointData = data;
        done();
      });
    });

    it('should get waypoint data from the service', function() {
      waypointData.should.have.length(2);
    });

    it('should get data from the collection corresponding to the trail name', function() {
      fakeDataService.getLastCall().collectionName.should.match(/^pct_waypoints\d+$/);
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
      var options = {name: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20};
      waypoints.getData(options, function(err, data) {
        waypointData = data;
        done();
      });
    });

    it('should get data from the the collection corresponding to the maximum available detail level', function() {
      fakeDataService.getLastCall().collectionName.should.match(/.*14$/);
    });
  });

  describe('when encountering an error', function() {
    var errorFromCall;

    before(function(done){
      fakeDataService.shouldErrorOnNextCall = true;
      var options = {name: "pct", north: 50, south: 32, east: -110, west: -125, detailLevel: 20};
      waypoints.getData(options, function(err, data) {
        errorFromCall = err;
        done();
      });
    });

    it('should propagate the error', function() {
      should.exist(errorFromCall);
    });
  });
});