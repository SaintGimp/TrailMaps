/*global trailMaps: false*/

import mapContainer from "./mapcontainer.js";
import NavbarModel from "./navbarModel.js";
import CreateWaypointModel from "./createWaypointModel.js";
import Autocomplete from "./autocomplete.js";

// Load Bootstrap 5 dynamically
const bootstrapScript = document.createElement("script");
bootstrapScript.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
document.head.appendChild(bootstrapScript);

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

// Track loaded APIs to avoid reloading
const loadedAPIs = {
  bing: false,
  google: false,
  here: false
};

// Load external map APIs as needed
const mapAPIs = {
  bing: async () => {
    if (loadedAPIs.bing) return;
    window.bingMapsReady = () => {
      loadedAPIs.bing = true;
    };
    await loadScript("https://www.bing.com/api/maps/mapcontrol?callback=bingMapsReady");
  },
  google: async () => {
    if (loadedAPIs.google) return;
    window.googleMapsReady = () => {
      loadedAPIs.google = true;
    };
    // Load markerwithlabel first, then Google Maps
    await loadScript("/js/lib/markerwithlabel_packed.js");
    await loadScript(
      `https://maps.googleapis.com/maps/api/js?key=${trailMaps.configuration.googleApiKey}&callback=googleMapsReady`
    );
  },
  here: async () => {
    if (loadedAPIs.here) return;
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

      // Handle map pill clicks (only for bing, google, here)
      if (target.tagName === "A" && target.closest(".nav-pills")) {
        const href = target.getAttribute("href");
        if (href && (href.includes("/bing") || href.includes("/google") || href.includes("/here"))) {
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
