/*jshint expr:true*/
/*global trailMaps:true*/

define(["q", "jquery", "/test/lib/Squire.js"], function(Q, $, Squire) {
  var navbarModel;
  var server;
  var numberOfServerRequests;
  var injector;
  var mapContainerStub;
  var sandbox;

  function initializeNavBar(done) {
    sandbox = sinon.sandbox.create();

    mapContainerStub = {
      showingMap: sandbox.stub().returns(new Q()),
      setCenterAndZoom: sandbox.stub(),
      getUrlFragment: sandbox.stub().returns('bing?blahblah')
    };

    injector = new Squire();
    injector.mock({
      'mapcontainer': mapContainerStub,
      'history': sandbox.stub(window.history)
    });

    injector.require(['navbarModel'], function(NavbarModel) {
      navbarModel = new NavbarModel();
      done();
    });
  }

  function cleanup()
  {
    sandbox.restore();
  }

  function responder(request, trail, queryString) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, '{ "loc": [ -120, 39 ], "mile": 1234 }');
  }

  function nullResponder(request, trail, queryString) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, 'null');
  }

  function typeaheadResponder(request, trail, queryString) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, '["foo", "bar"]');
  }

  describe('Nav bar', function() {
    describe('Searching for mile markers', function() {
      before(function(done) {
        initializeNavBar(function() {
          numberOfServerRequests = 0;
          server = sinon.fakeServer.create();

          navbarModel.searchText("1234");
          navbarModel.search();

          server.respond('/api/trails/pct/milemarkers/1234', responder);
          done();
        });
      });

      it ('should get the mile marker from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ('should center the map on the mile marker', function() {
        expect(mapContainerStub.setCenterAndZoom.calledWithMatch({
          center: {
            latitude: 39,
            longitude: -120
          },
          zoom: 14
        })).to.be.ok;
      });

      after(function() {
        cleanup();
        server.restore();
      });
    });

    describe('Searching for an invalid mile marker', function() {
      before(function(done) {
        initializeNavBar(function() {
          numberOfServerRequests = 0;
          server = sinon.fakeServer.create();

          navbarModel.searchText("4567");
          navbarModel.search();

          server.respond('/api/trails/pct/milemarkers/4567', nullResponder);
          done();
        });
      });

      it ('should get the mile marker from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ('should not move the map view', function() {
        expect(mapContainerStub.setCenterAndZoom.called).to.not.be.ok;
      });

      after(function() {
        cleanup();
        server.restore();
      });
    });

    describe('Searching for latitude/longitude', function() {
      before(function(done) {
        initializeNavBar(function() {
          navbarModel.searchText("39.1, -120.2");
          navbarModel.search();
          done();
        });
      });

      it ('should center the map on the coordinates', function() {
        expect(mapContainerStub.setCenterAndZoom.calledWithMatch({
          center: {
            latitude: 39.1,
            longitude: -120.2
          },
          zoom: 14
        })).to.be.ok;
      });

      it ('Should recognize all forms of latitude/longitude coordinates', function() {
        expect('39,-120').to.match(navbarModel.coordinatesRegex);
        expect('39, -120').to.match(navbarModel.coordinatesRegex);
        expect('39.1234,  -120.5789').to.match(navbarModel.coordinatesRegex);
        expect('-39.1234,120.5789').to.match(navbarModel.coordinatesRegex);

        expect('foo').to.not.match(navbarModel.coordinatesRegex);
        expect('1234').to.not.match(navbarModel.coordinatesRegex);
        expect('1234.5').to.not.match(navbarModel.coordinatesRegex);
      });

      it ('Should correctly parse latitude/longitude coordinates', function() {
        expect('39,-120'.match(navbarModel.numberRegex)).to.eql(['39', '-120']);
        expect('39.1, -120.2'.match(navbarModel.numberRegex)).to.eql(['39.1', '-120.2']);
      });

      after(function() {
        cleanup();
        server.restore();
      });
    });

    describe('Searching for waypoints', function() {
      before(function(done) {
        initializeNavBar(function() {
          numberOfServerRequests = 0;
          server = sinon.fakeServer.create();

          navbarModel.searchText("foo bar");
          navbarModel.search();

          server.respond('/api/trails/pct/waypoints/foo%20bar', responder);
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
        cleanup();
        server.restore();
      });
    });

    describe('Searching for an invalid waypoint', function() {
      before(function(done) {
        initializeNavBar(function() {
          numberOfServerRequests = 0;
          server = sinon.fakeServer.create();

          navbarModel.searchText("north pole");
          navbarModel.search();

          server.respond('/api/trails/pct/waypoints/north%20pole', nullResponder);
          done();
        });
      });

      it ('should get the waypoint from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ('should not move the map view', function() {
        expect(mapContainerStub.setCenterAndZoom.called).to.not.be.ok;
      });

      after(function() {
        cleanup();
        server.restore();
      });
    });

    describe('Querying for a waypoint typeahead list', function() {
      var typeaheadData;

      before(function(done) {
        initializeNavBar(function() {
          numberOfServerRequests = 0;
          server = sinon.fakeServer.create();

          navbarModel.waypointTypeaheadSource("foo", function(data) {
            typeaheadData = data;
          });

          server.respond('/api/trails/pct/waypoints/typeahead/foo', typeaheadResponder);
          done();
        });
      });

      it ('should get the typeahead list from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ('should process the typeahead list', function() {
        expect(typeaheadData).to.eql(["foo", "bar"]);
      });

      after(function() {
        cleanup();
        server.restore();
      });
    });

    describe('Querying for a waypoint typeahead list with non-waypoint text', function() {
      before(function(done) {
        initializeNavBar(function() {
          numberOfServerRequests = 0;
          server = sinon.fakeServer.create();

          navbarModel.waypointTypeaheadSource("1234");

          server.respond('/api/trails/pct/waypoints/typeahead/1234', typeaheadResponder);
          done();
        });
      });

      it ('should not try to get the typeahead list from the server', function() {
        expect(numberOfServerRequests).to.equal(0);
      });

      after(function() {
        cleanup();
        server.restore();
      });
    });

    describe('Selecting a typeahead item', function() {
      before(function(done) {
        initializeNavBar(function() {
          numberOfServerRequests = 0;
          server = sinon.fakeServer.create();

          navbarModel.waypointTypeaheadUpdater("foo");

          server.respond('/api/trails/pct/waypoints/foo', responder);
          done();
        });
      });

      it ('should get the waypoint from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      after(function() {
        cleanup();
        server.restore();
      });
    });

    describe('Showing a map', function() {
      before(function(done) {
        initializeNavBar(function() {
          navbarModel.onPillClick(null, {target: {href: 'foo/google'}});
          done();
        });
      });

      it ('should show the map in the map container', function() {
        expect(mapContainerStub.showingMap.calledWith('google')).to.be.ok;
      });

      it ('should publish the active map name', function() {
        expect(navbarModel.activeMapName()).to.equal('google');
      });

      it ('should add the map to the browser history', function() {
        expect(history.pushState.calledWith('google', null, 'foo/google')).to.be.ok;
      });

      after(function() {
        cleanup();
      });
    });

    describe('Displaying the URL for the current map and view', function() {
      before(function(done) {
        initializeNavBar(function() {
          navbarModel.displayUrl();
          done();
        });
      });

      it ('should display the URL in the address bar', function() {
        expect(history.replaceState.calledWith('bing', null, 'bing?blahblah')).to.be.ok;
      });

      after(function() {
        cleanup();
      });
    });

  });
});
