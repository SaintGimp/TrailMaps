/* global chai: false */
/* jshint -W024 */
/* jshint expr:true */

define(["/test/client/Squire.js", "/test/client/fakeMap.js"], function(Squire, FakeMap) {
  var injector;
  var fakeBingMaps;
  var fakeGoogleMaps;
  var fakeHereMaps;
  var mapControl;

  describe('map control', function() {
    beforeEach(function(done) {
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
        done();
      });
    });

    it ('should be created', function() {
      expect(mapControl).to.be.ok;
    });

    it ('should initialize', function(done) {
      mapControl.initialize(injector.require.bind(injector), function() {
        expect(fakeBingMaps.getZoom()).to.equal(5);
        done();
      });
    });
  });
});
