/*global define: false*/

define(['q', 'jquery', 'trailmaps', 'knockout'], function(Q, $, trailmaps, ko) {
  var activeMap;
  var defaultCenter = new trailmaps.Location(trailmaps.configuration.defaultLatitude, trailmaps.configuration.defaultLongitude);
  var defaultZoomLevel = trailmaps.configuration.defaultZoom;
  // The view that the container will work to display, but the map control may be lagging behing
  var currentContainerView = {
    center: defaultCenter,
    zoom: defaultZoomLevel
  };
  var scrollBoundsMultiple = 2;
  var trackBoundsMultiple = 3;
  var scrollBounds = null;
  var currentTrailData = null;
  var trailDataZoomLevel = null;
  var requireFunc;
  var viewChangedListener = null;

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
          self.control.initialize(container, currentContainerView.center, currentContainerView.zoom, onViewChanged)
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
    currentContainerView = options;
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
        activeMap.setCenterAndZoom(currentContainerView);
        displayTrail();
      } else {
        var newView = activeMap.getCenterAndZoom();
        if (!viewsAreSame(currentContainerView, newView)) {
          activeMap.setCenterAndZoom(currentContainerView);
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
    trailDataZoomLevel = currentContainerView.zoom;

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

    var detail = currentContainerView.zoom;

    return '?north=' + north + '&south=' + south + '&east=' + east + '&west=' + west + "&detail=" + detail;
  }

  function onViewChanged() {
    if (needToLoadNewData()) {
      loadTrail();
    }

    currentContainerView = activeMap.getCenterAndZoom();
    if (viewChangedListener !== null) {
      viewChangedListener(getViewOptions());
    }
  }

  function needToLoadNewData() {
    if (scrollBounds === null) {
      return true;
    }

    if (activeMap.getZoom() !== trailDataZoomLevel) {
      return true;
    }

    return !scrollBounds.contains(activeMap.getCenter());
  }

  function getUrlFragment() {
    var lat = currentContainerView.center.latitude.toFixed(5);
    var lon = currentContainerView.center.longitude.toFixed(5);
    return activeMapName() + '?lat=' + lat + '&lon=' + lon + '&zoom=' + currentContainerView.zoom;
  }

  function getViewOptions() {
    return {
      mapName: activeMapName(),
      view: currentContainerView
    };
  }

  function addViewChangedListener(listener) {
    viewChangedListener = listener;
  }

  return {
    initialize: initialize,
    setCenterAndZoom: setCenterAndZoom,
    showingMap: showingMap,
    activeMapName: activeMapName,
    getUrlFragment: getUrlFragment,
    getViewOptions: getViewOptions,
    addViewChangedListener: addViewChangedListener,

    // For testing
    defaultCenter: defaultCenter,
    defaultZoomLevel: defaultZoomLevel,
    trackBoundsMultiple: trackBoundsMultiple
  };
});