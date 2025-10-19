/*global trailMaps: false*/

import mapContainer from "./mapcontainer.js";

export default function NavbarModel() {
  const self = this;

  // State
  let activeMapName = trailMaps.configuration.defaultMapName.toLowerCase();
  let searchText = "";

  // Map view change listener
  mapContainer.addViewChangedListener(function () {
    replaceCurrentHistoryNode();
  });

  // Public API
  self.getActiveMapName = () => activeMapName;
  self.setActiveMapName = (name) => {
    activeMapName = name;
    updateActiveMapUI();
  };

  self.getSearchText = () => searchText;
  self.setSearchText = (text) => {
    searchText = text;
    const searchBox = document.getElementById("searchBox");
    if (searchBox) {
      searchBox.value = text;
    }
  };

  self.onPillClick = function (event) {
    event.preventDefault();
    const href = event.target.href;
    const mapName = href.substr(href.lastIndexOf("/") + 1, href.length).toLowerCase();

    if (mapName !== activeMapName) {
      showMap(mapName).then(function () {
        replaceCurrentHistoryNode();
      });
    }
    return false;
  };

  self.onEarthClick = function (event) {
    event.preventDefault();
    const url = "https://earth.google.com/web/" + mapContainer.getGoogleEarthUrlFragment();
    window.open(url, "_blank");
    return false;
  };

  function showMap(mapName) {
    mapName = mapName.toLowerCase();
    self.setActiveMapName(mapName);
    return mapContainer.showingMap(mapName);
  }

  function updateActiveMapUI() {
    // Update active pill in navbar (Bootstrap 5 uses .nav-link for active state)
    const navLinks = document.querySelectorAll(".nav-pills .nav-link");
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.endsWith("/" + activeMapName)) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Update map visibility
    const mapDivs = document.querySelectorAll(".map-control");
    mapDivs.forEach((div) => {
      if (div.id === activeMapName) {
        div.classList.add("active");
      } else {
        div.classList.remove("active");
      }
    });
  }

  self.restoreHistoryState = function (options) {
    showMap(options.mapName).then(() => {
      // Map restored
    });
    mapContainer.setCenterAndZoom(options.view);
  };

  self.typeAheadSelected = function (obj, data) {
    self.setSearchText(data);
    self.search();
  };

  self.search = function () {
    const searchBox = document.getElementById("searchBox");
    const text = searchBox ? searchBox.value : searchText;
    searchText = text;

    if (isCoordinates(text)) {
      gotoCoordinates(text);
    } else if (isMileMarker(text)) {
      gotoMileMarker(text);
    } else {
      gotoWaypoint(text);
    }
  };

  self.waypointTypeaheadSource = function (query, process) {
    if (isWaypoint(query)) {
      const url = "/api/trails/pct/waypoints/typeahead/" + encodeURIComponent(query);
      return fetch(url)
        .then((response) => response.json())
        .then((data) => process(data));
    }
  };

  self.waypointTypeaheadUpdater = function (item) {
    self.setSearchText(item);
    self.search();
    return item;
  };

  const coordinatesRegex = /^-?\d*\.?\d+,\s*-?\d*\.?\d+$/;
  const numberRegex = /-?\d*\.?\d+/g;
  const mileMarkerRegex = /^\d*\.?\d?$/;

  function gotoMileMarker(mileMarker) {
    const url = "/api/trails/pct/milemarkers/" + mileMarker;
    fetch(url)
      .then((response) => response.json())
      .then((result) => {
        if (result) {
          changeMapView({
            center: {
              latitude: result.loc[1],
              longitude: result.loc[0]
            },
            zoom: 14
          });
        }
      });
  }

  function gotoCoordinates(location) {
    const numbers = location.match(numberRegex);
    changeMapView({
      center: {
        latitude: parseFloat(numbers[0]),
        longitude: parseFloat(numbers[1])
      },
      zoom: 14
    });
  }

  function gotoWaypoint(waypoint) {
    const url = "/api/trails/pct/waypoints?name=" + encodeURIComponent(waypoint);
    fetch(url)
      .then((response) => response.json())
      .then((result) => {
        if (result && result.length) {
          changeMapView({
            center: {
              latitude: result[0].loc[1],
              longitude: result[0].loc[0]
            },
            zoom: 14
          });
        }
      });
  }

  function changeMapView(options) {
    replaceCurrentHistoryNode();
    mapContainer.setCenterAndZoom(options);
    addNewHistoryNode();
  }

  function isCoordinates(text) {
    return text.match(coordinatesRegex);
  }

  function isMileMarker(text) {
    return text.match(mileMarkerRegex);
  }

  function isWaypoint(text) {
    return !isCoordinates(text) && !isMileMarker(text);
  }

  self.initializeBrowserHistory = function () {
    replaceCurrentHistoryNode();
  };

  function replaceCurrentHistoryNode() {
    const url = mapContainer.getUrlFragment();
    window.history.replaceState(mapContainer.getViewOptions(), null, url);
  }

  function addNewHistoryNode() {
    const url = mapContainer.getUrlFragment();
    window.history.pushState(mapContainer.getViewOptions(), null, url);
  }

  // Initialize UI
  updateActiveMapUI();
}
