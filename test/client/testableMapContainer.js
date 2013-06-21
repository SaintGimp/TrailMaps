/*jshint expr:true*/

// TODO: can we set maps for the test stuff in testem.json?
define(["jquery", "/test/lib/Squire.js", "/test/client/fakeMap.js", 'q'], function($, Squire, FakeMap, Q) {
  var injector;
  var loadedModules;
  var mapContainer;

  function mockedRequire(modules, callback) {
    $.each(modules, function(index, value) {
      loadedModules.push(value);
    });
    injector.require(modules, callback);
  }

  function trailResponder(request, trail, queryString) {
    mapContainer.numberOfServerRequests++;
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

  function initializeMapContainer(mapName) {
    var fakeBingMaps = new FakeMap();
    var fakeGoogleMaps = new FakeMap();
    var fakeHereMaps = new FakeMap();

    injector = new Squire();
    injector.mock({
      'bingmaps': fakeBingMaps,
      'googlemaps': fakeGoogleMaps,
      'heremaps': fakeHereMaps
    });

    var deferred = Q.defer();
    injector.require(['mapcontainer'], function(newMapContainer) {
      mapContainer = newMapContainer;
      mapContainer.loadedModules = loadedModules;
      mapContainer.fakeBingMaps = fakeBingMaps;
      mapContainer.fakeGoogleMaps = fakeGoogleMaps;
      mapContainer.fakeHereMaps = fakeHereMaps;
      mapContainer.numberOfServerRequests = 0;

      mapContainer.initialize(mockedRequire, mapName)
      .done(function() {
        deferred.resolve(mapContainer);
      });
    });

    return deferred.promise;
  }

  function create(mapName, server) {
    loadedModules = [];
    server.respondWith(/\/api\/trails\/(\w+)\?(.+)/, trailResponder);

    return initializeMapContainer(mapName);
  }

  return {
    create: create
  };
});
