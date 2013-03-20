define(['trailmaps'], function(trailmaps) {
  function FakeMap() {
    var self = this;
    self.viewChangedHandler = undefined;
    self.center = undefined;
    self.zoom = undefined;

    self.initialize = function(latitude, longitude, zoomLevel, onViewChanged, callback) {
      self.center = trailmaps.Location(latitude, longitude);
      self.zoom = zoomLevel;
      self.viewChangedHandler = onViewChanged;
      callback();
    };

    self.displayTrack = function(trail) {
    };

    self.displayMileMarkers = function(trail) {
    };

    self.getCenter = function() {
      return self.center;
    };

    self.getBounds = function() {
      return new trailmaps.Rectangle(self.center, 0.25, 0.25);
    };

    self.getZoom = function() {
      return self.zoom;
    };

    self.getCenterAndZoom = function() {
      return {
        center: self.center,
        zoom: self.zoom
      };
    };

    self.setCenterAndZoom = function(options) {
      self.center = options.center;
      self.zoom = options.zoom;
    };
  }

  return FakeMap;
});
