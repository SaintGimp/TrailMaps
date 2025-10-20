/*global trailMaps: false*/

import mapContainer from "./mapcontainer.js";
import NavbarModel from "./navbarModel.js";
import CreateWaypointModel from "./createWaypointModel.js";
import Autocomplete from "./autocomplete.js";

// Helper function to load external stylesheets
function loadStylesheet(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    document.head.appendChild(link);
  });
}

// Helper function to load external scripts
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// Load Bootstrap 5 dynamically
loadStylesheet("https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css");
loadScript("https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js");

// Track loaded APIs to avoid reloading
const loadedAPIs = {
  azure: false,
  google: false,
  here: false
};

// Load external map APIs as needed
const mapAPIs = {
  azure: async () => {
    if (loadedAPIs.azure) return;
    await loadStylesheet("https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css");
    await loadScript("https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js");
    loadedAPIs.azure = true;
  },
  google: async () => {
    if (loadedAPIs.google) return;
    // Load markerwithlabel library for Google Maps
    await loadScript("https://unpkg.com/@googlemaps/markerwithlabel/dist/index.min.js");
    // The main Google Maps API will be loaded by googlemaps.js
    loadedAPIs.google = true;
  },
  here: async () => {
    if (loadedAPIs.here) return;
    await loadStylesheet("http://js.api.here.com/v3/3.0/mapsjs-ui.css");
    await loadScript("http://js.api.here.com/v3/3.0/mapsjs-core.js");
    await loadScript("http://js.api.here.com/v3/3.0/mapsjs-service.js");
    await loadScript("http://js.api.here.com/v3/3.0/mapsjs-ui.js");
    await loadScript("http://js.api.here.com/v3/3.0/mapsjs-mapevents.js");
    loadedAPIs.here = true;
  }
};

// Initialize the application
async function initialize() {
  await mapContainer.initialize(mapAPIs, trailMaps.configuration.defaultMapName);

  const navbarModel = new NavbarModel();
  const createWaypointModel = new CreateWaypointModel(mapContainer);

  // Wire up navbar event handlers
  const navbarElement = document.querySelector(".navbar");
  if (navbarElement) {
    navbarElement.addEventListener("click", function (event) {
      const target = event.target;

      // Handle Earth link (external link, not a map)
      if (target.tagName === "A" && target.textContent === "Earth") {
        navbarModel.onEarthClick(event);
        return;
      }

      // Handle map pill clicks (only for azure, google, here)
      if (target.tagName === "A" && target.closest(".nav-pills")) {
        const href = target.getAttribute("href");
        if (href && (href.includes("/azure") || href.includes("/google") || href.includes("/here"))) {
          navbarModel.onPillClick(event);
        }
      }
    });

    // Handle form submission
    const searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        navbarModel.search();
      });
    }
  }

  // Wire up create waypoint dialog event handlers
  const createWaypointDialog = document.getElementById("createWaypointDialog");
  if (createWaypointDialog) {
    const createButton = createWaypointDialog.querySelector('button[type="submit"]');
    if (createButton) {
      createButton.addEventListener("click", function (event) {
        event.preventDefault();
        createWaypointModel.create();
      });
    }
  }

  // Setup autocomplete
  const searchBox = document.getElementById("searchBox");
  if (searchBox) {
    // Initialize autocomplete
    new Autocomplete(searchBox, {
      minLength: 3,
      source: navbarModel.waypointTypeaheadSource,
      onSelect: function (value) {
        navbarModel.setSearchText(value);
        navbarModel.search();
      }
    });

    // Handle Enter key for search
    searchBox.addEventListener("keydown", function (event) {
      if (event.keyCode === 13) {
        navbarModel.search();
      }
    });
  }

  navbarModel.initializeBrowserHistory();
  window.onpopstate = function (event) {
    navbarModel.restoreHistoryState(event.state);
  };
}

// Start the application
initialize().catch((error) => {
  console.error("Failed to initialize application:", error);
});
