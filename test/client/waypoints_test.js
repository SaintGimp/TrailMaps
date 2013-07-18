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

    describe('Editing a waypoint', function() {
      before(function(done) {
        initialize(function() {
          waypointsViewModel.loadData();
          sandbox.server.respond('/api/trails/pct/waypoints', getWaypointsResponder);

          waypointsViewModel.edit(waypointsViewModel.waypoints()[0]);
          done();
        });
      });

      it ('should use the edit template for the waypoint', function() {
        expect(waypointsViewModel.templateName(waypointsViewModel.waypoints()[0])).to.equal('edit-template');
      });

      after(function() {
        cleanup();
      });
    });

    describe('Editing a waypoint and then another one', function() {
      before(function(done) {
        initialize(function() {
          waypointsViewModel.loadData();
          sandbox.server.respond('/api/trails/pct/waypoints', getWaypointsResponder);

          waypointsViewModel.edit(waypointsViewModel.waypoints()[0]);
          waypointsViewModel.waypoints()[0].name("edited");
          waypointsViewModel.edit(waypointsViewModel.waypoints()[1]);
          done();
        });
      });

      it ('should cancel the edit for the first waypoint', function() {
        expect(waypointsViewModel.waypoints()[0].name()).to.equal('one');
      });

      it ('should use the normal template for the first waypoint', function() {
        expect(waypointsViewModel.templateName(waypointsViewModel.waypoints()[0])).to.equal('waypoint-template');
      });

      it ('should use the edit template for the second waypoint', function() {
        expect(waypointsViewModel.templateName(waypointsViewModel.waypoints()[1])).to.equal('edit-template');
      });

      after(function() {
        cleanup();
      });
    });

    describe('Confirming a waypoint edit', function() {
      var updatedWaypoint;

      function updateWaypointResponder(request) {
        numberOfServerRequests++;
        updatedWaypoint = JSON.parse(request.requestBody);
        request.respond(200);
      }

      before(function(done) {
        initialize(function() {
          waypointsViewModel.loadData();
          sandbox.server.respond('/api/trails/pct/waypoints', getWaypointsResponder);

          waypointsViewModel.edit(waypointsViewModel.waypoints()[0]);
          waypointsViewModel.waypoints()[0].name('edited');
          waypointsViewModel.confirmEdit(waypointsViewModel.waypoints()[0]);
          sandbox.server.respond('PUT', '/api/trails/pct/waypoints/123', updateWaypointResponder);
          done();
        });
      });

      it ('should use the normal template for the waypoint', function() {
        expect(waypointsViewModel.templateName(waypointsViewModel.waypoints()[0])).to.equal('waypoint-template');
      });

      it ('should have the new values', function() {
        expect(waypointsViewModel.waypoints()[0].name()).to.equal('edited');
      });

      it ('should save the waypoint to the server', function() {
        expect(numberOfServerRequests).to.equal(2);
        expect(updatedWaypoint).to.deep.equal({
          name: "edited",
          loc: [ -120, 39 ],
          _id: "123"
        });
      });

      after(function() {
        cleanup();
      });
    });

    describe('Canceling a waypoint edit', function() {
      before(function(done) {
        initialize(function() {
          waypointsViewModel.loadData();
          sandbox.server.respond('/api/trails/pct/waypoints', getWaypointsResponder);

          waypointsViewModel.edit(waypointsViewModel.waypoints()[0]);
          waypointsViewModel.waypoints()[0].name('edited');
          waypointsViewModel.cancelEdit(waypointsViewModel.waypoints()[0]);
          done();
        });
      });

      it ('should use the normal template for the waypoint', function() {
        expect(waypointsViewModel.templateName(waypointsViewModel.waypoints()[0])).to.equal('waypoint-template');
      });

      it ('should have the old values', function() {
        expect(waypointsViewModel.waypoints()[0].name()).to.equal('one');
      });

      it ('should not save the waypoint to the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      after(function() {
        cleanup();
      });
    });

  });
});
