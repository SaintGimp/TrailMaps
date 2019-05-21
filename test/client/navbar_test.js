/* global sinon:false */

define(["q", "jquery", "/test/lib/Squire.js", "/test/client/testableMapContainer.js"], function(Q, $, Squire, testableMapContainer) {
  var navbarModel;
  var injector;
  var mapContainer;
  var server;
  var numberOfServerRequests;
  var historyStub;

  function initializeNavBar(done) {
    server = sinon.createFakeServer();
    server.respondImmediately = true;
    numberOfServerRequests = 0;

    testableMapContainer.create("bing", server)
    .done(function(newMapContainer) {
      server.respond();
      mapContainer = newMapContainer;

      historyStub = {
        pushState: sinon.stub(),
        replaceState: sinon.stub()
      };
      injector = new Squire();
      injector.mock({
        "mapcontainer": mapContainer,
        "history": historyStub
      });

      injector.require(["navbarModel"], function(NavbarModel) {
        navbarModel = new NavbarModel();
        done();
      });
    });
  }

  function cleanup()
  {
    server.restore();
  }

  function mileMarkerResponder(request) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, '{ "loc": [ -120, 39 ], "mile": 1234 }');
  }

  function waypointResponder(request) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, '[{ "name": "foo bar", "loc": [ -120, 39 ]}]');
  }

  function nullResponder(request) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, "null");
  }

  function emptyListResponder(request) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, "[]");
  }

  function typeaheadResponder(request) {
    numberOfServerRequests++;
    request.respond(200, { "Content-Type": "application/json" }, '["foo", "bar"]');
  }

  describe("Nav bar", function() {
    describe("Searching for mile markers", function() {
      var originalViewOptions;
      var originalUrlFragment;

      before(function(done) {
        initializeNavBar(function() {
          originalViewOptions = mapContainer.getViewOptions();
          originalUrlFragment = mapContainer.getUrlFragment();

          server.respondWith("/api/trails/pct/milemarkers/1234", mileMarkerResponder);

          navbarModel.searchText("1234");
          navbarModel.search();

          done();
        });
      });

      it ("should get the mile marker from the server", function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ("should center the map on the mile marker", function() {
        expect(mapContainer.getViewOptions().view).to.deep.equal({
          center: {
            latitude: 39,
            longitude: -120
          },
          zoom: 14
        });
      });

      it ("should replace the current browser history node with the previous view", function() {
        expect(historyStub.replaceState.calledWith(originalViewOptions, null, originalUrlFragment)).to.be.ok;
      });

      it ("should add the new map view to the browser history", function() {
        expect(historyStub.pushState.calledWith(mapContainer.getViewOptions(), null, mapContainer.getUrlFragment())).to.be.ok;
      });

      after(function() {
        cleanup();
      });
    });

    describe("Searching for an invalid mile marker", function() {
      var originalViewOptions;

      before(function(done) {
        initializeNavBar(function() {
          originalViewOptions = mapContainer.getViewOptions();
          server.respondWith("/api/trails/pct/milemarkers/4567", nullResponder);

          navbarModel.searchText("4567");
          navbarModel.search();

          done();
        });
      });

      it ("should get the mile marker from the server", function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ("should not move the map view", function() {
        expect(mapContainer.getViewOptions()).to.deep.equal(originalViewOptions);
      });

      after(function() {
        cleanup();
      });
    });

    describe("Searching for latitude/longitude", function() {
      before(function(done) {
        initializeNavBar(function() {
          navbarModel.searchText("39.1, -120.2");
          navbarModel.search();
          done();
        });
      });

      it ("should center the map on the coordinates", function() {
        expect(mapContainer.getViewOptions().view).to.deep.equal({
          center: {
            latitude: 39.1,
            longitude: -120.2
          },
          zoom: 14
        });
      });

      it ("Should recognize all forms of latitude/longitude coordinates", function() {
        expect("39,-120").to.match(navbarModel.coordinatesRegex);
        expect("39, -120").to.match(navbarModel.coordinatesRegex);
        expect("39.1234,  -120.5789").to.match(navbarModel.coordinatesRegex);
        expect("-39.1234,120.5789").to.match(navbarModel.coordinatesRegex);

        expect("foo").to.not.match(navbarModel.coordinatesRegex);
        expect("1234").to.not.match(navbarModel.coordinatesRegex);
        expect("1234.5").to.not.match(navbarModel.coordinatesRegex);
      });

      it ("Should correctly parse latitude/longitude coordinates", function() {
        expect("39,-120".match(navbarModel.numberRegex)).to.eql(["39", "-120"]);
        expect("39.1, -120.2".match(navbarModel.numberRegex)).to.eql(["39.1", "-120.2"]);
      });

      after(function() {
        cleanup();
      });
    });

    describe("Searching for waypoints", function() {
      before(function(done) {
        initializeNavBar(function() {
          server.respondWith("/api/trails/pct/waypoints?name=foo%20bar", waypointResponder);

          navbarModel.searchText("foo bar");
          navbarModel.search();
          
          done();
        });
      });

      it ("should get the waypoint from the server", function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ("should center the map on the waypoint", function() {
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

    describe("Searching for an invalid waypoint", function() {
      var originalViewOptions;

      before(function(done) {
        initializeNavBar(function() {
          originalViewOptions = mapContainer.getViewOptions();
          server.respondWith("/api/trails/pct/waypoints?name=north%20pole", emptyListResponder);

          navbarModel.searchText("north pole");
          navbarModel.search();

          done();
        });
      });

      it ("should get the waypoint from the server", function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ("should not move the map view", function() {
        expect(mapContainer.getViewOptions()).to.deep.equal(originalViewOptions);
      });

      after(function() {
        cleanup();
      });
    });

    describe("Querying for a waypoint typeahead list", function() {
      var typeaheadData;

      before(function(done) {
        initializeNavBar(function() {
          server.respondWith("/api/trails/pct/waypoints/typeahead/foo", typeaheadResponder);

          navbarModel.waypointTypeaheadSource("foo", function(data) {
            typeaheadData = data;
          });

          done();
        });
      });

      it ("should get the typeahead list from the server", function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ("should process the typeahead list", function() {
        expect(typeaheadData).to.eql(["foo", "bar"]);
      });

      after(function() {
        cleanup();
      });
    });

    describe("Querying for a waypoint typeahead list with non-waypoint text", function() {
      before(function(done) {
        initializeNavBar(function() {
          server.respondWith("/api/trails/pct/waypoints/typeahead/1234", typeaheadResponder);

          navbarModel.waypointTypeaheadSource("1234");

          done();
        });
      });

      it ("should not try to get the typeahead list from the server", function() {
        expect(numberOfServerRequests).to.equal(0);
      });

      after(function() {
        cleanup();
      });
    });

    describe("Selecting a typeahead item", function() {
      before(function(done) {
        initializeNavBar(function() {
          server.respondWith("/api/trails/pct/waypoints?name=foo", waypointResponder);

          navbarModel.waypointTypeaheadUpdater("foo");

          done();
        });
      });

      it ("should get the waypoint from the server", function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      after(function() {
        cleanup();
      });
    });

    describe("Showing a map", function() {
      before(function(done) {
        initializeNavBar(function() {
          navbarModel.onPillClick(null, {target: {href: "foo/google"}}, function() {
            done();
          });
        });
      });

      it ("should show the map in the map container", function() {
        expect(mapContainer.getViewOptions().mapName).to.equal("google");
      });

      it ("should publish the active map name", function() {
        expect(navbarModel.activeMapName()).to.equal("google");
      });

      it ("should replace the current browser history node with the new map name", function() {
        expect(historyStub.replaceState.calledWith(mapContainer.getViewOptions(), null, mapContainer.getUrlFragment())).to.be.ok;
      });

      after(function() {
        cleanup();
      });
    });

    describe("Showing a map that has been shown before", function() {
      before(function(done) {
        initializeNavBar(function() {
          navbarModel.onPillClick(null, {target: {href: "foo/google"}}, function() {
            navbarModel.onPillClick(null, {target: {href: "foo/bing"}}, function() {
              done();
            });
          });
        });
      });

      it ("should show the map in the map container", function() {
        expect(mapContainer.getViewOptions().mapName).to.equal("bing");
      });

      it ("should publish the active map name", function() {
        expect(navbarModel.activeMapName()).to.equal("bing");
      });

      it ("should replace the current browser history node with the new map name", function() {
        expect(historyStub.replaceState.calledWith(mapContainer.getViewOptions(), null, mapContainer.getUrlFragment())).to.be.ok;
      });

      after(function() {
        cleanup();
      });
    });

    describe("Changing the map container view", function() {
      before(function(done) {
        initializeNavBar(function() {
          var viewOptions = mapContainer.getViewOptions();
          viewOptions.view.zoom++;
          mapContainer.setCenterAndZoom(viewOptions.view);
          done();
        });
      });

      it ("should replace the current browser history node with the new view", function() {
        expect(historyStub.replaceState.calledWith(mapContainer.getViewOptions(), null, mapContainer.getUrlFragment())).to.be.ok;
      });

      after(function() {
        cleanup();
      });
    });

  });
});
