/*jshint expr:true*/

// TODO: can we set maps for the test stuff in testem.json?
define(["jquery", "/test/lib/Squire.js", "/test/client/fakeMap.js"], function($, Squire, FakeMap) {
  var server;
  var injector;
  var fakeBingMaps;
  var fakeGoogleMaps;
  var fakeHereMaps;
  var loadedModules;
  var numberOfServerRequests;
  var mapContainer;

  function mockedRequire(modules, callback) {
    $.each(modules, function(index, value) {
      loadedModules.push(value);
    });
    injector.require(modules, callback);
  }

  function trailResponder(request, trail, queryString) {
    numberOfServerRequests++;
    var north = parseFloat(/north=([\-+]?[0-9]*\.?[0-9]+)/.exec(queryString)[1]);
    var south = parseFloat(/south=([\-+]?[0-9]*\.?[0-9]+)/.exec(queryString)[1]);
    var east = parseFloat(/east=([\-+]?[0-9]*\.?[0-9]+)/.exec(queryString)[1]);
    var west = parseFloat(/west=([\-+]?[0-9]*\.?[0-9]+)/.exec(queryString)[1]);
    var detail = parseFloat(/detail=([\-+]?[0-9]*\.?[0-9]+)/.exec(queryString)[1]);

    var data = {
      mileMarkers: [{loc:[west + ((east - west) / 2), south + ((north - south) / 2)], mile:1234}],
      track: [{loc:[west, north]}, {loc:[east, south]}],
    };
    request.respond(200, { "Content-Type": "application/json" }, JSON.stringify(data));
  }

  function initializeFakeServer() {
    server = sinon.fakeServer.create();
    server.respondWith(/\/api\/trails\/(\w+)\?(.+)/, trailResponder);
  }

  function initializeDOM() {
    $('#testArea').remove();
    $('body').append('<div id="testArea" style="width:400px; height:200px; border:solid red 2px"></div>');
    $('#testArea').append('<div id="bingmaps"</div>');
    $('#testArea').append('<div id="googlemaps"</div>');
    $('#testArea').append('<div id="heremaps"</div>');
  }

  function initializeMapContainer(done) {
    fakeBingMaps = new FakeMap();
    fakeGoogleMaps = new FakeMap();
    fakeHereMaps = new FakeMap();

    injector = new Squire();
    injector.mock({
      'bingmaps': fakeBingMaps,
      'googlemaps': fakeGoogleMaps,
      'heremaps': fakeHereMaps
    });
    injector.require(['mapcontainer'], function(newMapContainer) {
      mapContainer = newMapContainer;
      mapContainer.initialize(mockedRequire, function() {
        done();
      });
    });
  }

  function initialize(done) {
    loadedModules = [];
    numberOfServerRequests = 0;
    initializeFakeServer();
    initializeDOM();
    initializeMapContainer(function() {
      server.respond();
      done();
    });
  }

  function cleanup() {
    $('#testArea').remove();
    server.restore();
  }

  function verifyMapTrailDataMatchesView(map) {
    var west = map.trackData[0].loc[0];
    var north = map.trackData[0].loc[1];
    var east = map.trackData[1].loc[0];
    var south = map.trackData[1].loc[1];
    var width = east - west;
    var height = north - south;
    expect(width).to.equal(map.getBounds().width * mapContainer.trackBoundsMultiple);
    expect(height).to.equal(map.getBounds().height * mapContainer.trackBoundsMultiple);

    var marker = map.mileMarkerData[0];
    expect(marker.loc[0]).to.equal(map.getCenter().longitude);
    expect(marker.loc[1]).to.equal(map.getCenter().latitude);
  }

  describe('Map container', function() {
    describe('Initializing the map container', function() {
      before(function(done) {
        initialize(done);
      });

      after(function() {
        cleanup();
      });

      it ('should load the default map module', function() {
        expect(loadedModules.length).to.equal(1);
        expect(loadedModules[0]).to.equal("bingmaps");
      });

      it ('should give the map module a DOM element to work with', function() {
        expect(fakeBingMaps.container.id).to.equal($('#bingmaps')[0].id);
      });

      it ('should configure the first map module with the default center and zoom', function() {
        var config = fakeBingMaps.getCenterAndZoom();
        expect(config.center).to.equal(mapContainer.defaultCenter);
        expect(config.zoom).to.equal(mapContainer.defaultZoomLevel);
      });

      it ('should load trail data from the server and display it on the map', function() {
        expect(numberOfServerRequests).to.equal(1);
        expect(fakeBingMaps.trackData).to.be.ok;
        expect(fakeBingMaps.mileMarkerData).to.be.ok;

        verifyMapTrailDataMatchesView(fakeBingMaps);
      });
    });

    describe('Switching to another map type', function() {
      before(function(done) {
        initialize(function() {
          mapContainer.showingMap('#googlemaps');
          server.respond();
          done();
        });
      });

      after(function() {
        cleanup();
      });

      it ('should load the default and the new map modules', function() {
        expect(loadedModules.length).to.equal(2);
        expect(loadedModules[1]).to.equal("googlemaps");
      });

      it ('should give the new map module a DOM element to work with', function() {
        expect(fakeGoogleMaps.container.id).to.equal($('#googlemaps')[0].id);
      });

      it ('should configure the second map module with the same center and zoom as the first map', function() {
        var config = fakeGoogleMaps.getCenterAndZoom();
        expect(config.center).to.equal(mapContainer.defaultCenter);
        expect(config.zoom).to.equal(mapContainer.defaultZoomLevel);
      });

      it ('should not reload trail data from the server', function() {
        expect(numberOfServerRequests).to.equal(1);
      });

      it ('should display trail data on the second map', function() {
        verifyMapTrailDataMatchesView(fakeGoogleMaps);
      });
    });

    describe('Zooming in on the map', function() {
      before(function(done) {
        initialize(function() {
          fakeBingMaps.setCenterAndZoom({
            center: fakeBingMaps.getCenter(),
            zoom: fakeBingMaps.getZoom() + 1
          });
          server.respond();
          done();
        });
      });

      after(function() {
        cleanup();
      });

      it ('should load new trail data', function() {
        expect(numberOfServerRequests).to.equal(2);
      });
    });
  });
});
