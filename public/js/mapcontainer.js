/*global define: false*/

define(['jquery', 'trailmaps'], function($, trailmaps) {
  var activeMap;
  var defaultCenter = new trailmaps.Location(40.50642708521896, -121.36087699433327);
  var currentCenter = defaultCenter;
  var defaultZoomLevel = 5;
  var currentZoomLevel = defaultZoomLevel;
  var scrollBoundsMultiple = 2;
  var trackBoundsMultiple = 3;
  var scrollBounds = null;
  var currentTrailData = null;
  var requireFunc;

  function Map(moduleName) {
    var self = this;
    self.control = undefined;

    self.moduleName = moduleName;

    self.getControl = function(callback) {
      // We lazy-create the map controls so that a) we don't do an expensive init if the user
      // never clicks over to that tab, and b) some of them (Google, I'm looking at you) won't
      // init properly when their div is hidden, so we have to wait until it becomes visible
      // to do the init.
      if (!self.control) {
        requireFunc([moduleName], function(createdControl) {
          self.control = createdControl;
          var container = $("#" + moduleName)[0];
          self.control.initialize(container, currentCenter, currentZoomLevel, onViewChanged, function() {
            callback(self.control, true);
          });
        });
      } else {
        callback(self.control, false);
      }
    };
  }

  var maps = {
    "#bingmaps": new Map('bingmaps'),
    "#googlemaps": new Map('googlemaps'),
    "#heremaps": new Map('heremaps'),
  };

  function initialize(suppliedRequireFunc, callback) {
    requireFunc = suppliedRequireFunc;
    showingMap('#bingmaps', function() {
      if (callback) {
        callback();
      }
    });
  }

  function setCenterAndZoom(center, zoomLevel) {
    currentCenter = center;
    currentZoomLevel = zoomLevel;
    activeMap.setCenterAndZoom(center, zoomLevel);
  }

  function getCurrentView() {
    return {
      center: currentCenter,
      zoom: currentZoomLevel
    };
  }

  function showingMap(mapHash, callback) {
    maps[mapHash].getControl(function(control, isNew) {
      var currentView = getCurrentView();

      activeMap = control;

      if (!currentTrailData) {
        loadTrail();
      } else if (isNew) {
        displayTrail();
      }

      var newView = activeMap.getCenterAndZoom();
      if (!viewsAreSame(currentView, newView)) {
        activeMap.setCenterAndZoom(currentView);
        displayTrail();
      }

      if (callback) {
        callback();
      }
    });
  }

  function viewsAreSame(currentView, newView) {
    return currentView.center.latitude === newView.center.latitude &&
      currentView.center.longitude === newView.center.longitude &&
      currentView.zoom === newView.zoom;
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

  function displayTrail() {
    console.log('Sending trail data to map control');
    activeMap.displayTrack(currentTrailData.track);
    activeMap.displayMileMarkers(currentTrailData.mileMarkers);
  }

  function loadTrail() {
    calculateScrollBounds();
    var trackBounds = calculateTrackBounds();

    var trailUrl = '/api/trails/pct' + buildUrlParameters(trackBounds);

    console.log("Loading " + trailUrl);

    $.getJSON(trailUrl, null, function (data) {
      currentTrailData = data;
      displayTrail();
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
    console.log('onviewchanged');
    if (needToLoadNewData()) {
      loadTrail();
    }

    currentCenter = activeMap.getCenter();
    currentZoomLevel = activeMap.getZoom();
  }

  function needToLoadNewData() {
    if (scrollBounds === null) {
      return true;
    }

    if (activeMap.getZoom() !== currentZoomLevel) {
      return true;
    }

    return !scrollBounds.contains(activeMap.getCenter());
  }

  return {
    initialize: initialize,
    setCenterAndZoom: setCenterAndZoom,
    showingMap: showingMap,

    // For testing
    defaultCenter: defaultCenter,
    defaultZoomLevel: defaultZoomLevel,
    trackBoundsMultiple: trackBoundsMultiple
  };
});