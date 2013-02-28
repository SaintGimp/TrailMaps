/*global define: false*/

define(['./trailmaps'], function(trailmaps) {
  var activeMap;
  var defaultLatitude = 40.50642708521896;
  var defaultLongitude = -121.36087699433327;
  var defaultZoomLevel = 5;
  var previousZoomLevel = defaultZoomLevel;
  var scrollBoundsMultiple = 2;
  var trackBoundsMultiple = 3;
  var scrollBounds = null;
  var currentTrailData = null;

  function Map(moduleName) {
    this.control = undefined;

    this.moduleName = moduleName;

    this.getControl = function(callback) {
      // We lazy-create the map controls so that a) we don't do an expensive init if the user
      // never clicks over to that tab, and b) some of them (Google, I'm looking at you) won't
      // init properly when their div is hidden, so we have to wait until it becomes visible
      // to do the init.
      if (!this.control) {
        require([moduleName], function(createdControl) {
          this.control = createdControl;
          this.control.initialize(defaultLatitude, defaultLongitude, defaultZoomLevel, onViewChanged, function() {
            callback(this.control);
          });
        });
      } else {
        callback(this.control);
      }
    };
  }

  var maps = {
    "#bing-maps": new Map('./bingmaps'),
    "#google-maps": new Map('./googlemaps'),
    "#here-maps": new Map('./heremaps'),
  };

  function initialize() {
    maps["#bing-maps"].getControl(function(control) {
      activeMap = control;
    });
  }

  function setCenterAndZoom(center, zoomLevel) {
    activeMap.setCenterAndZoom(center, zoomLevel);
  }

  function showingMap(mapHash) {
    var centerAndZoom = activeMap.getCenterAndZoom();
    maps[mapHash].getControl(function(control) {
      activeMap = control;
      activeMap.setCenterAndZoom(centerAndZoom);
      displayTrail(currentTrailData);
    });
  }

  function calculateScrollBounds() {
    // The map bounds adjusts the center if height gets too big so we get the map center directly
    var mapCenter = activeMap.getCenter();
    var mapBounds = activeMap.getBounds();
    var scrollBoundsSize = mapBounds.width * scrollBoundsMultiple;
    // We get weird behavior when west goes past -180 and wraps around to +180. We should
    // probably build a custom rect in that case that's constrained to west < east, but this
    // will do for now.  The Bing.Location class has a NormalizeLongitude thing that might be of some help.
    scrollBoundsSize = Math.min(scrollBoundsSize, 60);
    scrollBounds = new trailmaps.Rectangle(mapCenter, scrollBoundsSize, scrollBoundsSize);
  }

  function calculateTrackBounds() {
    var mapCenter = activeMap.getCenter();
    var mapBounds = activeMap.getBounds();
    var trackBoundsSize = mapBounds.width * trackBoundsMultiple;
    trackBoundsSize = Math.min(trackBoundsSize, 60);
    return new trailmaps.Rectangle(mapCenter, trackBoundsSize, trackBoundsSize);
  }

  function displayTrail(trail) {
    activeMap.displayTrack(trail);
    activeMap.displayMileMarkers(trail);
  }

  function loadTrail() {
    calculateScrollBounds();
    var trackBounds = calculateTrackBounds();

    var trailUrl = 'api/trails/pct' + buildUrlParameters(trackBounds);

    console.log("Loading " + trailUrl);

    $.getJSON(trailUrl, null, function (data) {
      displayTrail(data);
      currentTrailData = data;
    });
  }

  function buildUrlParameters(trackBounds) {
    var north = trackBounds.north;
    var south = trackBounds.south;
    var east = trackBounds.east;
    var west = trackBounds.west;

    var detail = activeMap.getZoom();

    return '?north=' + north + '&south=' + south + '&east=' + east + '&west=' + west + "&detail=" + detail;
  }

  function onViewChanged() {
    if (needToLoadNewData()) {
      loadTrail();
    }
  }

  function needToLoadNewData() {
    if (scrollBounds === null) {
      return true;
    }

    if (activeMap.getZoom() !== previousZoomLevel) {
      previousZoomLevel = activeMap.getZoom();
      return true;
    }

    return !scrollBounds.contains(activeMap.getCenter());
  }

  return {
    initialize: initialize,
    setCenterAndZoom: setCenterAndZoom,
    showingMap: showingMap
  };
});