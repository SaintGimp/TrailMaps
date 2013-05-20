/*global define: false*/

define(['q', 'jquery', 'trailmaps', 'knockout'], function(Q, $, trailmaps, ko) {
  var activeMap;
  var defaultCenter = new trailmaps.Location(40.50642708521896, -121.36087699433327);
  var defaultZoomLevel = 5;
  var currentView = {
    center: defaultCenter,
    zoom: defaultZoomLevel
  };
  var scrollBoundsMultiple = 2;
  var trackBoundsMultiple = 3;
  var scrollBounds = null;
  var currentTrailData = null;
  var requireFunc;

  var activeMapName = ko.observable('');

  function Map(moduleName, containerName) {
    var self = this;
    self.control = undefined;

    self.moduleName = moduleName;

    self.getControl = function() {
      // We lazy-create the map controls so that a) we don't do an expensive init if the user
      // never clicks over to that tab, and b) some of them (Google, I'm looking at you) won't
      // init properly when their div is hidden, so we have to wait until it becomes visible
      // to do the init.
      var deferred = Q.defer();

      if (!self.control) {
        requireFunc([moduleName], function(createdControl) {
          self.control = createdControl;
          var container = $("#" + containerName)[0];
          self.control.initialize(container, currentView.center, currentView.zoom, onViewChanged)
          .then(function() {
            deferred.resolve({ control: self.control, isNew: true });
          });
        });
      } else {
        deferred.resolve({ control: self.control, isNew: false });
      }

      return deferred.promise;
    };
  }

  var maps = {
    "bing": new Map('bingmaps', 'bing'),
    "google": new Map('googlemaps', 'google'),
    "here": new Map('heremaps', 'here'),
  };

  function initialize(suppliedRequireFunc, mapName) {
    requireFunc = suppliedRequireFunc;
    return showingMap(mapName);
  }

  function setCenterAndZoom(options) {
    activeMap.setCenterAndZoom(options);
  }

  function showingMap(mapName) {
    activeMapName(mapName);

    return maps[mapName].getControl()
    .then(function(controlData) {
      activeMap = controlData.control;

      if (!currentTrailData) {
        loadTrail();
      } else if (controlData.isNew) {
        displayTrail();
      } else {
        var newView = activeMap.getCenterAndZoom();
        if (!viewsAreSame(currentView, newView)) {
          activeMap.setCenterAndZoom(currentView);
          displayTrail();
        }
      }
    });
  }

  function viewsAreSame(view1, view2) {
    return view1.center.latitude === view2.center.latitude &&
      view1.center.longitude === view2.center.longitude &&
      view1.zoom === view2.zoom;
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
    activeMap.displayTrack(currentTrailData.track);
    activeMap.displayMileMarkers(currentTrailData.mileMarkers);
  }

  function loadTrail() {
    calculateScrollBounds();
    var trackBounds = calculateTrackBounds();

    var trailUrl = '/api/trails/pct' + buildUrlParameters(trackBounds);

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
    if (needToLoadNewData()) {
      loadTrail();
    }

    currentView = activeMap.getCenterAndZoom();
  }

  function needToLoadNewData() {
    if (scrollBounds === null) {
      return true;
    }

    if (activeMap.getZoom() !== currentView.zoom) {
      return true;
    }

    return !scrollBounds.contains(activeMap.getCenter());
  }

  return {
    initialize: initialize,
    setCenterAndZoom: setCenterAndZoom,
    showingMap: showingMap,
    activeMapName: activeMapName,

    // For testing
    defaultCenter: defaultCenter,
    defaultZoomLevel: defaultZoomLevel,
    trackBoundsMultiple: trackBoundsMultiple
  };
});