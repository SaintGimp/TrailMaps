/*global Microsoft: false*/
/*global google: false*/

requirejs.config({
  baseUrl: "/js",
  paths: {
    "jquery" : "https://code.jquery.com/jquery-2.1.3.min",
    "bootstrap": "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min",
    "typeahead": "https://twitter.github.io/typeahead.js/releases/0.10.5/typeahead.bundle.min",
    "async": "lib/async",
    "markerwithlabel": "lib/markerwithlabel_packed",
    "here_maps_api": "https://api.maps.nokia.com/2.2.4/jsl.js?with=maps",
    "knockout": "https://cdnjs.cloudflare.com/ajax/libs/knockout/3.3.0/knockout-min",
    "q": "lib/q"
  },
  shim: {
    "bootstrap": {
      deps: ["jquery"],
      exports: "$.fn.popover"
    },
    "knockout": {
      deps: ["jquery"]
    },
    "typeahead": {
      deps: ["jquery"]
    },
    "bing_maps_api": {
      exports: "Microsoft"
    },
    "here_maps_api": {
      exports: "nokia"
    },
    "markerwithlabel": {
      deps: ["google_maps_api"]
    },
  },
  // This may be important for IE: http://requirejs.org/docs/api.html#ieloadfail
  //enforceDefine: true,
});

define("bing_maps_api", ["async!https://www.bing.com/api/maps/mapcontrol!callback"], function() {
  return Microsoft;
});

define("google_maps_api", ["async!https://maps.googleapis.com/maps/api/js?key=" + trailMaps.configuration.googleApiKey], function() {
  return google;
});

define("history", function() {
  return window.history;
});

require(["jquery", "knockout", "bootstrap", "typeahead", "./trailmaps", "./mapcontainer", "./navbarModel", "./createWaypointModel"], function($, ko, bootstrap, typeAhead, trailMaps, mapContainer, NavbarModel, CreateWaypointModel) {
  mapContainer.initialize(require, trailMaps.configuration.defaultMapName)
  .done();
  ko.applyBindings(mapContainer, $("#mapCanvas").get(0));

  var navbarModel = new NavbarModel();
  ko.applyBindings(navbarModel, $(".navbar").get(0));

  var createWaypointModel = new CreateWaypointModel(mapContainer);
  ko.applyBindings(createWaypointModel, $("#createWaypointDialog").get(0));

  // TODO: Not sure this is the best place to wire this up but I don"t see any better options at the moment
  $("#searchBox").typeahead(
    {
      hint: true,
      highlight: true,
      minLength: 3
    },
    {
      name: "waypoints",
      source: navbarModel.waypointTypeaheadSource,
      displayKey: function(value) {
        return value;
      }
    })
  .bind("typeahead:selected", navbarModel.search)
  .keydown(function(event) {
    if (event.keyCode === 13) {
      navbarModel.search();
    }
  });

  navbarModel.initializeBrowserHistory();
  window.onpopstate = function(event) {
    navbarModel.restoreHistoryState(event.state);
  };
});
