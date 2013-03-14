/*global expect: false*/

define(["jquery", "../../public/js/mapcontrol.js"], function($, mapControl) {
  describe('map control', function() {
    it ('should be created', function() {
      expect(mapControl).to.be.ok();
    });

    it ('should initialize', function(done) {
      $('#testArea').append('<div id="bing-maps"></div>');
      mapControl.initialize(done);

      expect(mapControl).to.be.ok();
    });
  });
});
