/* global sinon:false */

define(["q", "jquery", "mapContainer", "createWaypointModel"], function(Q, $, mapContainer, CreateWaypointModel) {
  var createWaypointModel;
  var sandbox;
  var numberOfServerRequests;

  function initialize(done) {
    createWaypointModel = new CreateWaypointModel(mapContainer);

    sandbox = sinon.sandbox.create();
    sandbox.useFakeServer();
    numberOfServerRequests = 0;

    done();
  }

  function cleanup()
  {
    sandbox.restore();
  }

  describe("Waypoints", function() {
    describe("Creating a waypoint", function() {
      var newWaypointData;

      function createWaypointResponder(request) {
          numberOfServerRequests++;
          newWaypointData = JSON.parse(request.requestBody);
          request.respond(200);
      }

      before(function(done) {
        initialize(function() {
          createWaypointModel.waypointName("new waypoint");
          createWaypointModel.create();
          sandbox.server.respond("POST", "/api/trails/pct/waypoints", createWaypointResponder);
          done();
        });
      });

      it ("should create a waypoint", function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ("should create a naned waypoint at the current location", function() {
        expect(newWaypointData).to.deep.equal({
          name: "new waypoint",
          loc: [ mapContainer.defaultCenter.longitude, mapContainer.defaultCenter.latitude ]
        });
      });

      after(function() {
        cleanup();
      });
    });
  });
});
