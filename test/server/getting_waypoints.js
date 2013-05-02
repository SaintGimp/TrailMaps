/*jshint expr:true*/

var expect = require('chai').expect;
var fakeDataService = require('./fakeDataService');
var waypoints = require('../../domain/waypoints')(fakeDataService);

describe('Finding a waypoint by name', function() {
  var foundWaypoint;

  describe('when finding a waypoint', function() {
    before(function(done){
      var options = { trailName: "pct", name: "waypoint" };
      waypoints.findByName(options)
      .done(function(waypoint) {
        foundWaypoint = waypoint;
        done();
      });
    });

    it('should get a waypoint from the service', function() {
      expect(foundWaypoint).to.exist;
    });

    it('should get the waypoint from the collection corresponding to the trail name', function() {
      expect(fakeDataService.getLastCall().collectionName).to.equal("pct_waypoints");
    });

    it('should get a waypoint whos name starts with the search text', function() {
      expect(fakeDataService.getLastCall().searchTerms.name.source).to.equal("^waypoint");
      expect(fakeDataService.getLastCall().searchTerms.name.ignoreCase).to.be.ok;
    });
  });
});

describe('Getting waypoint typeahead lists', function() {
  var foundWaypointNames;

  describe('when getting a typeahead list', function() {
    before(function(done){
      var options = { trailName: "pct", text: "foo" };
      waypoints.getTypeaheadList(options)
      .done(function(waypointNames) {
        foundWaypointNames = waypointNames;
        done();
      });
    });

    it('should get waypoint names from the service', function() {
      expect(foundWaypointNames).to.exist;
    });

    it('should get the waypoint names from the collection corresponding to the trail name', function() {
      expect(fakeDataService.getLastCall().collectionName).to.equal("pct_waypoints");
    });

    it('should get all waypoints that contain the search text', function() {
      expect(fakeDataService.getLastCall().searchTerms.name.source).to.equal("foo");
      expect(fakeDataService.getLastCall().searchTerms.name.ignoreCase).to.be.ok;
    });
  });
});