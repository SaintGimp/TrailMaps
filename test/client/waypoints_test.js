/*jshint expr:true*/
/*global trailMaps:true*/

define(["q", "jquery", "waypointsViewModel"], function(Q, $, WaypointsViewModel) {
  var waypointsViewModel;
  var sandbox;
  var numberOfServerRequests;

  function initialize(done) {
    waypointsViewModel = new WaypointsViewModel();

    sandbox = sinon.sandbox.create();
    sandbox.useFakeServer();
    numberOfServerRequests = 0;

    done();
  }

  function cleanup()
  {
    sandbox.restore();
  }

  function getWaypointsResponder(request) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, '[{ "name": "one", "loc": [ -120, 39 ], "_id": "123" }, { "name": "two", "loc": [ -122, 45 ], "_id": "456" }]');
  }

  function deleteWaypointResponder(request) {
    numberOfServerRequests++;
    request.respond(200);
  }

  describe('Waypoints', function() {
    describe('Loading data from server', function() {
      before(function(done) {
        initialize(function() {
          waypointsViewModel.loadData();
          sandbox.server.respond('/api/trails/pct/waypoints', getWaypointsResponder);
          done();
        });
      });

      it ('should get waypoint data from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ('should create observable waypoints', function() {
        expect(waypointsViewModel.waypoints().length).to.equal(2);
        expect(waypointsViewModel.waypoints()[0].toJS()).to.deep.equal({
          name: "one",
          loc: [ -120, 39 ],
          _id: "123"
        });
      });

      after(function() {
        cleanup();
      });
    });

    describe('Deleting a waypoint', function() {
      before(function(done) {
        initialize(function() {
          waypointsViewModel.loadData();
          sandbox.server.respond('/api/trails/pct/waypoints', getWaypointsResponder);

          waypointsViewModel.deleteWaypoint(waypointsViewModel.waypoints()[0]);
          sandbox.server.respond('DELETE', '/api/trails/pct/waypoints/123', deleteWaypointResponder);
          done();
        });
      });

      it ('should delete the waypoint from the server', function() {
        expect(numberOfServerRequests).to.equal(2);
      });

      it ('remove the waypoint from the list', function() {
        expect(waypointsViewModel.waypoints().length).to.equal(1);
        expect(waypointsViewModel.waypoints()[0].id).to.equal('456');
      });

      after(function() {
        cleanup();
      });
    });

  });
});
