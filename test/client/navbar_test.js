/*jshint expr:true*/
/*global trailMaps:true*/

define(["q", "jquery", "/test/lib/Squire.js", "/test/client/testableMapContainer.js"], function(Q, $, Squire, testableMapContainer) {
  var navbarModel;
  var injector;
  var mapContainer;
  var sandbox;
  var numberOfServerRequests;

  function initializeNavBar(done) {
    sandbox = sinon.sandbox.create();
    sandbox.useFakeServer();
    numberOfServerRequests = 0;

    testableMapContainer.create("bing", sandbox.server)
    .done(function(newMapContainer) {
      sandbox.server.respond();
      mapContainer = newMapContainer;

      injector = new Squire();
      injector.mock({
        'mapcontainer': mapContainer,
        'history': sandbox.stub(window.history)
      });

      injector.require(['navbarModel'], function(NavbarModel) {
        navbarModel = new NavbarModel();
        done();
      });
    });
  }

  function cleanup()
  {
    sandbox.restore();
  }

  function responder(request) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, '{ "loc": [ -120, 39 ], "mile": 1234 }');
  }

  function nullResponder(request) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, 'null');
  }

  function typeaheadResponder(request) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, '["foo", "bar"]');
  }

  describe('Nav bar', function() {
    describe('Searching for mile markers', function() {
      var originalViewOptions;
      var originalUrlFragment;

      before(function(done) {
        initializeNavBar(function() {
          originalViewOptions = mapContainer.getViewOptions();
          originalUrlFragment = mapContainer.getUrlFragment();

          navbarModel.searchText("1234");
          navbarModel.search();

          sandbox.server.respond('/api/trails/pct/milemarkers/1234', responder);
          done();
        });
      });

      it ('should get the mile marker from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ('should center the map on the mile marker', function() {
        expect(mapContainer.getViewOptions().view).to.deep.equal({
          center: {
            latitude: 39,
            longitude: -120
          },
          zoom: 14
        });
      });

      it ('should replace the current browser history node with the previous view', function() {
        expect(history.replaceState.calledWith(originalViewOptions, null, originalUrlFragment)).to.be.ok;
      });

      it ('should add the new map view to the browser history', function() {
        expect(history.pushState.calledWith(mapContainer.getViewOptions(), null, mapContainer.getUrlFragment())).to.be.ok;
      });

      after(function() {
        cleanup();
      });
    });

    describe('Searching for an invalid mile marker', function() {
      var originalViewOptions;

      before(function(done) {
        initializeNavBar(function() {
          originalViewOptions = mapContainer.getViewOptions();

          navbarModel.searchText("4567");
          navbarModel.search();

          sandbox.server.respond('/api/trails/pct/milemarkers/4567', nullResponder);
          done();
        });
      });

      it ('should get the mile marker from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ('should not move the map view', function() {
        expect(mapContainer.getViewOptions()).to.deep.equal(originalViewOptions);
      });

      after(function() {
        cleanup();
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
        expect(mapContainer.getViewOptions().view).to.deep.equal({
          center: {
            latitude: 39.1,
            longitude: -120.2
          },
          zoom: 14
        });
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
      });
    });

    describe('Searching for waypoints', function() {
      before(function(done) {
        initializeNavBar(function() {
          navbarModel.searchText("foo bar");
          navbarModel.search();

          sandbox.server.respond('/api/trails/pct/waypoints/foo%20bar', responder);
          done();
        });
      });

      it ('should get the waypoint from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ('should center the map on the waypoint', function() {
        expect(mapContainer.getViewOptions().view).to.deep.equal({
          center: {
            latitude: 39,
            longitude: -120
          },
          zoom: 14
        });
      });

      after(function() {
        cleanup();
      });
    });

    describe('Searching for an invalid waypoint', function() {
      var originalViewOptions;

      before(function(done) {
        initializeNavBar(function() {
          originalViewOptions = mapContainer.getViewOptions();

          navbarModel.searchText("north pole");
          navbarModel.search();

          sandbox.server.respond('/api/trails/pct/waypoints/north%20pole', nullResponder);
          done();
        });
      });

      it ('should get the waypoint from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ('should not move the map view', function() {
        expect(mapContainer.getViewOptions()).to.deep.equal(originalViewOptions);
      });

      after(function() {
        cleanup();
      });
    });

    describe('Querying for a waypoint typeahead list', function() {
      var typeaheadData;

      before(function(done) {
        initializeNavBar(function() {
          navbarModel.waypointTypeaheadSource("foo", function(data) {
            typeaheadData = data;
          });

          sandbox.server.respond('/api/trails/pct/waypoints/typeahead/foo', typeaheadResponder);
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
      });
    });

    describe('Querying for a waypoint typeahead list with non-waypoint text', function() {
      before(function(done) {
        initializeNavBar(function() {
          navbarModel.waypointTypeaheadSource("1234");

          sandbox.server.respond('/api/trails/pct/waypoints/typeahead/1234', typeaheadResponder);
          done();
        });
      });

      it ('should not try to get the typeahead list from the server', function() {
        expect(numberOfServerRequests).to.equal(0);
      });

      after(function() {
        cleanup();
      });
    });

    describe('Selecting a typeahead item', function() {
      before(function(done) {
        initializeNavBar(function() {
          navbarModel.waypointTypeaheadUpdater("foo");

          sandbox.server.respond('/api/trails/pct/waypoints/foo', responder);
          done();
        });
      });

      it ('should get the waypoint from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      after(function() {
        cleanup();
      });
    });

    describe('Showing a map', function() {
      before(function(done) {
        initializeNavBar(function() {
          navbarModel.onPillClick(null, {target: {href: 'foo/google'}}, function() {
            done();
          });
        });
      });

      it ('should show the map in the map container', function() {
        expect(mapContainer.getViewOptions().mapName).to.equal('google');
      });

      it ('should publish the active map name', function() {
        expect(navbarModel.activeMapName()).to.equal('google');
      });

      it ('should replace the current browser history node with the new map name', function() {
        console.log(mapContainer.getViewOptions());
        expect(history.replaceState.calledWith(mapContainer.getViewOptions(), null, mapContainer.getUrlFragment())).to.be.ok;
      });

      after(function() {
        cleanup();
      });
    });

    describe('Showing a map that has been shown before', function() {
      before(function(done) {
        initializeNavBar(function() {
          navbarModel.onPillClick(null, {target: {href: 'foo/google'}}, function() {
            navbarModel.onPillClick(null, {target: {href: 'foo/bing'}}, function() {
              done();
            });
          });
        });
      });

      it ('should show the map in the map container', function() {
        expect(mapContainer.getViewOptions().mapName).to.equal('bing');
      });

      it ('should publish the active map name', function() {
        expect(navbarModel.activeMapName()).to.equal('bing');
      });

      it ('should replace the current browser history node with the new map name', function() {
        expect(history.replaceState.calledWith(mapContainer.getViewOptions(), null, mapContainer.getUrlFragment())).to.be.ok;
      });

      after(function() {
        cleanup();
      });
    });

    describe('Changing the map container view', function() {
      before(function(done) {
        initializeNavBar(function() {
          var viewOptions = mapContainer.getViewOptions();
          viewOptions.view.zoom++;
          mapContainer.setCenterAndZoom(viewOptions.view);
          done();
        });
      });

      it ('should replace the current browser history node with the new view', function() {
        expect(history.replaceState.calledWith(mapContainer.getViewOptions(), null, mapContainer.getUrlFragment())).to.be.ok;
      });

      after(function() {
        cleanup();
      });
    });

  });
});
