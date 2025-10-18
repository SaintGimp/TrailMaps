/*global Microsoft: false*/
/*global google: false*/
/*global trailMaps: false*/

requirejs.config({
  baseUrl: "/js",
  paths: {
    jquery: "https://code.jquery.com/jquery-2.2.4.min",
    bootstrap: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min",
    // There are multiple issues with more recent versions (e.g. 0.11.1) of Twitter Typeahead.  One, it's incompatible with require.js.
    // To get around that we have to use a fork of Twitter Typeahead that has a fix for compatibility with require.js from here:
    // https://github.com/nikcub/typeahead.
    // Second problem, there's some kind of imcompatibility with Bootstrap that prevents the autocomplete dropdown from showing up.
    // We already had to use a custom css file from https://github.com/hyspace/typeahead.js-bootstrap3.less  or
    // https://github.com/bassjobsen/typeahead.js-bootstrap-css to shim the two together,
    // even with old versions of Typehead, but the newest version of Typehead is broken again.  Don't know why yet.
    // Since everything is working ok right now, probably best not to mess with it.
    typeahead: "lib/typeahead.bundle.min",
    async: "lib/async",
    markerwithlabel: "lib/markerwithlabel_packed",
    here_maps_core: "http://js.api.here.com/v3/3.0/mapsjs-core",
    here_maps_ui: "http://js.api.here.com/v3/3.0/mapsjs-ui",
    here_maps_events: "http://js.api.here.com/v3/3.0/mapsjs-mapevents",
    here_maps_api: "http://js.api.here.com/v3/3.0/mapsjs-service"
  },
  shim: {
    bootstrap: {
      deps: ["jquery"],
      exports: "$.fn.popover"
    },
    typeahead: {
      deps: ["jquery"]
    },
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

require([
  "jquery",
  "bootstrap",
  "typeahead",
  "./trailmaps",
  "./mapcontainer",
  "./navbarModel",
  "./createWaypointModel"
], function ($, bootstrap, typeAhead, trailMaps, mapContainer, NavbarModel, CreateWaypointModel) {
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

      // Handle pill clicks
      if (target.tagName === "A" && target.closest(".navbar-pills")) {
        navbarModel.onPillClick(event);
      }

      // Handle Earth link
      if (target.textContent === "Earth") {
        navbarModel.onEarthClick(event);
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

  // Setup typeahead
  $("#searchBox")
    .typeahead(
      {
        hint: true,
        highlight: true,
        minLength: 3
      },
      {
        name: "waypoints",
        source: navbarModel.waypointTypeaheadSource,
        displayKey: function (value) {
          return value;
        }
      }
    )
    .bind("typeahead:selected", navbarModel.typeAheadSelected)
    .keydown(function (event) {
      if (event.keyCode === 13) {
        navbarModel.search();
      }
    });

  navbarModel.initializeBrowserHistory();
  window.onpopstate = function (event) {
    navbarModel.restoreHistoryState(event.state);
  };
});
