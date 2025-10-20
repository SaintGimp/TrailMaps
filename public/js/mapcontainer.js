import { Location, Rectangle, configuration } from "./trailmaps.js";

let activeMap;
const defaultCenter = new Location(configuration.defaultLatitude, configuration.defaultLongitude);
const defaultZoomLevel = configuration.defaultZoom;
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
let mapAPIs;
let viewChangedListener = null;

let activeMapName = "";

function Map(moduleName, containerName) {
  const self = this;
  self.control = undefined;
  self.moduleName = moduleName;

  self.getControl = async function () {
    // We lazy-create the map controls so that a) we don't do an expensive init if the user
    // never clicks over to that tab, and b) some of them (Google, I'm looking at you) won't
    // init properly when their div is hidden, so we have to wait until it becomes visible
    // to do the init.
    if (!self.control) {
      // Dynamically import the map control module
      const module = await import(`./${moduleName}.js`);
      self.control = module.default;
      const container = document.getElementById(containerName);
      await self.control.initialize(container, currentContainerView.center, currentContainerView.zoom, onViewChanged);
      return { control: self.control, isNew: true };
    } else {
      return { control: self.control, isNew: false };
    }
  };
}

const maps = {
  azure: new Map("azuremaps", "azure"),
  google: new Map("googlemaps", "google"),
  here: new Map("heremaps", "here")
};

async function initialize(suppliedMapAPIs, mapName) {
  mapAPIs = suppliedMapAPIs;
  // Load the API for the default map
  if (mapAPIs[mapName]) {
    await mapAPIs[mapName]();
  }
  return showingMap(mapName);
}

function setCenterAndZoom(options) {
  currentContainerView = options;
  activeMap.setCenterAndZoom(options);
}

async function showingMap(mapName) {
  activeMapName = mapName;

  // Load the API if not already loaded
  if (mapAPIs[mapName]) {
    await mapAPIs[mapName]();
  }

  const controlData = await maps[mapName].getControl();
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
  // will do for now.  The azure.Location class has a NormalizeLongitude thing that might be of some help.
  scrollBoundsSize = Math.min(scrollBoundsSize, 60);
  scrollBounds = new Rectangle(mapCenter, scrollBoundsSize, scrollBoundsSize);
}

function calculateTrackBounds() {
  const mapCenter = activeMap.getCenter();
  const mapBounds = activeMap.getBounds();
  let trackBoundsSize = mapBounds.width * trackBoundsMultiple;
  trackBoundsSize = Math.min(trackBoundsSize, 60);
  return new Rectangle(mapCenter, trackBoundsSize, trackBoundsSize);
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

  fetch(trailUrl)
    .then((response) => response.json())
    .then((data) => {
      currentTrailData = data;
      displayTrail();
    })
    .catch((error) => {
      console.error("Error loading trail data:", error);
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

export default {
  initialize,
  setCenterAndZoom,
  showingMap,
  activeMapName: () => activeMapName,
  getUrlFragment,
  getGoogleEarthUrlFragment,
  getViewOptions,
  addViewChangedListener,

  // For testing
  defaultCenter,
  defaultZoomLevel,
  trackBoundsMultiple
};
