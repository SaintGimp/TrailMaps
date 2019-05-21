/* global sinon:false */

define(["q", "jquery", "mapContainer", "createWaypointModel"], function(Q, $, mapContainer, CreateWaypointModel) {
  var createWaypointModel;
  var numberOfServerRequests;
  var server;

  function initialize(done) {
    createWaypointModel = new CreateWaypointModel(mapContainer);

    server = sinon.createFakeServer();
    server.respondImmediately = true;
    numberOfServerRequests = 0;

    done();
  }

  function cleanup()
  {
    server.restore();
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
          server.respondWith("POST", "/api/trails/pct/waypoints", createWaypointResponder);
          createWaypointModel.waypointName("new waypoint");
          createWaypointModel.create();
          server.respond();
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
