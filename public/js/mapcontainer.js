/*global define: false*/

define(["jquery", "trailmaps"], function ($, trailmaps) {
  let activeMap;
  const defaultCenter = new trailmaps.Location(
    trailmaps.configuration.defaultLatitude,
    trailmaps.configuration.defaultLongitude
  );
  const defaultZoomLevel = trailmaps.configuration.defaultZoom;
  // The view that the container will work to display, but the map control may be lagging behind
  let currentContainerView = {
    center: defaultCenter,
    zoom: defaultZoomLevel
  };
  const scrollBoundsMultiple = 2;
  const trackBoundsMultiple = 3;
  let scrollBounds = null;
  let currentTrailData = null;
  let trailDataZoomLevel = null;
  let requireFunc;
  let viewChangedListener = null;

  let activeMapName = "";

  function Map(moduleName, containerName) {
    const self = this;
    self.control = undefined;

    self.moduleName = moduleName;

    self.getControl = function () {
      // We lazy-create the map controls so that a) we don't do an expensive init if the user
      // never clicks over to that tab, and b) some of them (Google, I'm looking at you) won't
      // init properly when their div is hidden, so we have to wait until it becomes visible
      // to do the init.
      return new Promise((resolve) => {
        if (!self.control) {
          requireFunc([moduleName], function (createdControl) {
            self.control = createdControl;
            const container = $("#" + containerName)[0];
            self.control
              .initialize(container, currentContainerView.center, currentContainerView.zoom, onViewChanged)
              .then(function () {
                resolve({ control: self.control, isNew: true });
              });
          });
        } else {
          resolve({ control: self.control, isNew: false });
        }
      });
    };
  }

  const maps = {
    bing: new Map("bingmaps", "bing"),
    google: new Map("googlemaps", "google"),
    here: new Map("heremaps", "here")
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
    activeMapName = mapName;

    return maps[mapName].getControl().then(function (controlData) {
      activeMap = controlData.control;

      if (!currentTrailData) {
        loadTrail();
      } else if (controlData.isNew) {
        activeMap.setCenterAndZoom(currentContainerView);
        displayTrail();
      } else {
        const newView = activeMap.getCenterAndZoom();
        if (!viewsAreSame(currentContainerView, newView)) {
          activeMap.setCenterAndZoom(currentContainerView);
          displayTrail();
        }
      }
    });
  }

  function viewsAreSame(view1, view2) {
    return (
      view1.center.latitude === view2.center.latitude &&
      view1.center.longitude === view2.center.longitude &&
      view1.zoom === view2.zoom
    );
  }

  function calculateScrollBounds() {
    // The map bounds adjusts the center if height gets too big so we get the map center directly
    const mapCenter = activeMap.getCenter();
    const mapBounds = activeMap.getBounds();
    let scrollBoundsSize = mapBounds.width * scrollBoundsMultiple;
    // We get weird behavior when west goes past -180 and wraps around to +180. We should
    // probably build a custom rect in that case that's constrained to west < east, but this
    // will do for now.  The Bing.Location class has a NormalizeLongitude thing that might be of some help.
    scrollBoundsSize = Math.min(scrollBoundsSize, 60);
    scrollBounds = new trailmaps.Rectangle(mapCenter, scrollBoundsSize, scrollBoundsSize);
  }

  function calculateTrackBounds() {
    const mapCenter = activeMap.getCenter();
    const mapBounds = activeMap.getBounds();
    let trackBoundsSize = mapBounds.width * trackBoundsMultiple;
    trackBoundsSize = Math.min(trackBoundsSize, 60);
    return new trailmaps.Rectangle(mapCenter, trackBoundsSize, trackBoundsSize);
  }

  function displayTrail() {
    activeMap.displayTrack(currentTrailData.track);
    activeMap.displayMileMarkers(currentTrailData.mileMarkers);
  }

  function loadTrail() {
    calculateScrollBounds();
    const trackBounds = calculateTrackBounds();

    const trailUrl = "/api/trails/pct" + buildUrlParameters(trackBounds);
    trailDataZoomLevel = currentContainerView.zoom;

    $.getJSON(trailUrl, null, function (data) {
      currentTrailData = data;
      displayTrail();
    });
  }

  function buildUrlParameters(trackBounds) {
    const north = trackBounds.north;
    const south = trackBounds.south;
    const east = trackBounds.east;
    const west = trackBounds.west;

    const detail = currentContainerView.zoom;

    return "?north=" + north + "&south=" + south + "&east=" + east + "&west=" + west + "&detail=" + detail;
  }

  function onViewChanged() {
    currentContainerView = activeMap.getCenterAndZoom();

    if (needToLoadNewData()) {
      loadTrail();
    }

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
    const lat = currentContainerView.center.latitude.toFixed(5);
    const lon = currentContainerView.center.longitude.toFixed(5);
    return activeMapName + "?lat=" + lat + "&lon=" + lon + "&zoom=" + currentContainerView.zoom;
  }

  function getGoogleEarthUrlFragment() {
    const lat = currentContainerView.center.latitude.toFixed(5);
    const lon = currentContainerView.center.longitude.toFixed(5);
    return "@" + lat + "," + lon + ",5000a,0d";
  }

  function getViewOptions() {
    return {
      mapName: activeMapName,
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
    activeMapName: () => activeMapName,
    getUrlFragment: getUrlFragment,
    getGoogleEarthUrlFragment: getGoogleEarthUrlFragment,
    getViewOptions: getViewOptions,
    addViewChangedListener: addViewChangedListener,

    // For testing
    defaultCenter: defaultCenter,
    defaultZoomLevel: defaultZoomLevel,
    trackBoundsMultiple: trackBoundsMultiple
  };
});
