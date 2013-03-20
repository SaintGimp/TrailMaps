/* global chai: false */
/* jshint -W024 */
/* jshint expr:true */

define(["/test/client/Squire.js", "/test/client/fakeMap.js"], function(Squire, FakeMap) {
  var injector;
  var fakeBingMaps;
  var fakeGoogleMaps;
  var fakeHereMaps;
  var numberOfModulesLoaded = 0;
  var mapControl;

  function mockedRequire(modules, callback) {
    numberOfModulesLoaded++;
    injector.require(modules, callback);
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
      initializeMapControl(done);
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
      expect(false).to.be.ok;
    });
  });
});
