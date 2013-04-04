/*jshint expr:true*/

// TODO: can we set maps for the test stuff in testem.json?
define(["jquery", "/test/lib/Squire.js", "/test/client/fakeMap.js"], function($, Squire, FakeMap) {
  var server;
  var injector;
  var fakeBingMaps;
  var fakeGoogleMaps;
  var fakeHereMaps;
  var loadedModules = [];
  var numberOfServerRequests = 0;
  var mapControl;

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
    server.autoRespond = true;
  }

  function initializeDOM() {
    $('#testArea').append('<div id="bing-maps"</div>');
    $('#testArea').append('<div id="google-maps"</div>');
    $('#testArea').append('<div id="here-maps"</div>');
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
      initializeDOM();
      initializeMapControl(done);
    });

    after(function() {
      server.restore();
    });

    it ('should load the Bing map module ', function() {
      expect(loadedModules.length).to.equal(1);
      expect(loadedModules[0]).to.equal("bingmaps");
    });

    it ('should give the map module a DOM element to work with', function() {
      var config = fakeBingMaps.getCenterAndZoom();
      expect(config.center).to.equal(mapControl.defaultCenter);
      expect(config.zoom).to.equal(mapControl.defaultZoomLevel);
    });

    it ('should configure the first map module with the default center and zoom', function() {
      expect(fakeBingMaps.container.id).to.equal($('#bing-maps').id);
    });

    it ('should load trail data from the server and display it on the map', function() {
      expect(numberOfServerRequests).to.equal(1);
      expect(fakeBingMaps.trackData).to.be.ok;
      expect(fakeBingMaps.mileMarkerData).to.be.ok;

      var west = fakeBingMaps.trackData[0].loc[0];
      var north = fakeBingMaps.trackData[0].loc[1];
      var east = fakeBingMaps.trackData[1].loc[0];
      var south = fakeBingMaps.trackData[1].loc[1];
      var width = east - west;
      var height = north - south;
      expect(width).to.equal(fakeBingMaps.getBounds().width * mapControl.trackBoundsMultiple);
      expect(height).to.equal(fakeBingMaps.getBounds().height * mapControl.trackBoundsMultiple);

      var marker = fakeBingMaps.mileMarkerData[0];
      expect(marker.loc[0]).to.equal(fakeBingMaps.getCenter().longitude);
      expect(marker.loc[1]).to.equal(fakeBingMaps.getCenter().latitude);
    });
  });
});
