/*global Microsoft: false*/
/*global google: false*/
/*global trailMaps: false*/

requirejs.config({
  baseUrl: "/js",
  paths: {
    // Bootstrap 5 no longer requires jQuery
    bootstrap: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min",
    // There are multiple issues with more recent versions (e.g. 0.11.1) of Twitter Typeahead.  One, it's incompatible with require.js.
    // To get around that we have to use a fork of Twitter Typeahead that has a fix for compatibility with require.js from here:
    // https://github.com/nikcub/typeahead.
    // Second problem, there's some kind of imcompatibility with Bootstrap that prevents the autocomplete dropdown from showing up.
    // We already had to use a custom css file from https://github.com/hyspace/typeahead.js-bootstrap3.less  or
    // https://github.com/bassjobsen/typeahead.js-bootstrap-css to shim the two together,
    // even with old versions of Typehead, but the newest version of Typehead is broken again.  Don't know why yet.
    // Since everything is working ok right now, probably best not to mess with it.
    // NOTE: Typeahead will be replaced in Phase 2.4
    typeahead: "lib/typeahead.bundle.min",
    async: "lib/async",
    markerwithlabel: "lib/markerwithlabel_packed",
    here_maps_core: "http://js.api.here.com/v3/3.0/mapsjs-core",
    here_maps_ui: "http://js.api.here.com/v3/3.0/mapsjs-ui",
    here_maps_events: "http://js.api.here.com/v3/3.0/mapsjs-mapevents",
    here_maps_api: "http://js.api.here.com/v3/3.0/mapsjs-service"
  },
  shim: {
    bing_maps_api: {
      exports: "Microsoft"
    },
    here_maps_ui: {
      deps: ["here_maps_core"]
    },
    here_maps_events: {
      deps: ["here_maps_core"]
    },
    here_maps_api: {
      deps: ["here_maps_core", "here_maps_ui", "here_maps_events"],
      exports: "H"
    },
    markerwithlabel: {
      deps: ["google_maps_api"]
    }
  }
  // This may be important for IE: http://requirejs.org/docs/api.html#ieloadfail
  //enforceDefine: true,
});

define("bing_maps_api", ["async!https://www.bing.com/api/maps/mapcontrol!callback"], function () {
  return Microsoft;
});

define("google_maps_api", [
  "async!https://maps.googleapis.com/maps/api/js?key=" + trailMaps.configuration.googleApiKey
], function () {
  return google;
});

define("history", function () {
  return window.history;
});

// Bootstrap 5 no longer requires jQuery
// Typeahead temporarily disabled until Phase 2.4 (requires jQuery)
require(["bootstrap", "./trailmaps", "./mapcontainer", "./navbarModel", "./createWaypointModel"], function (
  bootstrap,
  trailMaps,
  mapContainer,
  NavbarModel,
  CreateWaypointModel
) {
  mapContainer.initialize(require, trailMaps.configuration.defaultMapName).then(() => {
    // Initialization complete
  });

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
      if (target.tagName === "A" && target.closest(".navbar-pills")) {
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

  // Setup typeahead - TEMPORARILY DISABLED until Phase 2.4
  // Typeahead requires jQuery which we've removed
  // Will be replaced with a modern autocomplete solution in Phase 2.4
  const searchBox = document.getElementById("searchBox");
  if (searchBox) {
    // For now, just add basic search functionality without autocomplete
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
});
