/*jshint expr:true*/

define(["/test/lib/Squire.js", "/test/client/fakeMap.js"], function(Squire, FakeMap) {
  var server;
  var injector;
  var fakeBingMaps;
  var fakeGoogleMaps;
  var fakeHereMaps;
  var numberOfModulesLoaded = 0;
  var numberOfServerRequests = 0;
  var mapControl;

  function mockedRequire(modules, callback) {
    numberOfModulesLoaded++;
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
      mileMarkers: [],
      track: [{loc:[west, north]}, {loc:[east, south]}],
      center: { latitude: south + ((north - south) / 2), longitude: west + ((east - west) / 2)},
      width: east - west,
      height: north - south,
      detail: detail
    };
    request.respond(200, { "Content-Type": "application/json" }, JSON.stringify(data));
  }

  function initializeFakeServer() {
    server = sinon.fakeServer.create();
    server.respondWith(/\/api\/trails\/(\w+)\?(.+)/, trailResponder);
    server.autoRespond = true;
  }

  function initializeMapControl(done) {
    fakeBingMaps = new FakeMap();
    fakeGoogleMaps = new FakeMap();
    fakeHereMaps = new FakeMap();

    injector = new Squire();
    injector.mock({
      'bingmaps': fakeBingMaps,
      'googlemaps': fakeGoogleMaps,
      'heremaps': fakeHereMaps
    });
    injector.require(['mapcontrol'], function(newMapControl) {
      mapControl = newMapControl;
      mapControl.initialize(mockedRequire, function() {
        done();
      });
    });
  }

  describe('Initializing the map control', function() {
    before(function(done) {
      initializeFakeServer();
      initializeMapControl(done);
    });

    after(function() {
      server.restore();
    });

    it ('should load the first map module ', function() {
      expect(numberOfModulesLoaded).to.equal(1);
    });

    it ('should configure the first map module with the default center and zoom', function() {
      var config = fakeBingMaps.getCenterAndZoom();
      expect(config.center).to.equal(mapControl.defaultCenter);
      expect(config.zoom).to.equal(mapControl.defaultZoomLevel);
    });

    it ('should load trail data from the server and display it on the map', function() {
      expect(numberOfServerRequests).to.equal(1);
      expect(fakeBingMaps.trackData).to.be.ok;
      expect(fakeBingMaps.mileMarkerData).to.be.ok;
      expect(fakeBingMaps.trackData.center).to.deep.equal(fakeBingMaps.getBounds().center);
      expect(fakeBingMaps.trackData.width).to.equal(fakeBingMaps.getBounds().width * mapControl.trackBoundsMultiple);
      expect(fakeBingMaps.trackData.height).to.equal(fakeBingMaps.getBounds().height * mapControl.trackBoundsMultiple);
      expect(fakeBingMaps.trackData.detail).to.equal(fakeBingMaps.getZoom());
    });
  });
});
