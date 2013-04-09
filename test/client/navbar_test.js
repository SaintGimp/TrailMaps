/*jshint expr:true*/

define(["jquery", "/test/lib/Squire.js"], function($, Squire) {
  var navbarModel;
  var server;
  var numberOfServerRequests;
  var injector;
  var mapContainerStub;

  function initializeNavBar(done) {
    mapContainerStub = {
      showingMap: sinon.spy(),
      setCenterAndZoom: sinon.spy()
    };
    injector = new Squire();
    injector.mock({
      'mapcontainer': mapContainerStub,
    });
    injector.require(['navbarModel'], function(NavbarModel) {
      navbarModel = new NavbarModel();
      done();
    });
  }

  function responder(request, trail, queryString) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, '{ "loc": [ -120, 39 ], "mile": 1234 }');
  }

  describe('Nav bar', function() {
    describe('Searching for mile markers', function() {
      before(function(done) {
        initializeNavBar(function() {
          numberOfServerRequests = 0;
          server = sinon.fakeServer.create();

          navbarModel.searchText("1234");
          navbarModel.gotoWaypoint();

          server.respond('/api/trails/pct/milemarkers/1234', responder);
          done();
        });
      });

      it ('should get the waypoint from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ('should center the map on the waypoint', function() {
        expect(mapContainerStub.setCenterAndZoom.calledWithMatch({
          center: {
            latitude: 39,
            longitude: -120
          },
          zoom: 14
        })).to.be.ok;
      });

      after(function() {
        server.restore();
      });
    });
  });
});
