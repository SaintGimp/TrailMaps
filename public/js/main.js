/*global Microsoft: false*/
/*global google: false*/
/*global nokia: false*/

requirejs.config({
  baseUrl: "/js",
  paths: {
    "jquery" : "https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min",
    "bootstrap": "../bootstrap/js/bootstrap.min",
    "async": "lib/async",
    "markerwithlabel": "lib/markerwithlabel_packed",
    "here_maps_api": "http://api.maps.nokia.com/2.2.4/jsl.js?with=maps",
    "knockout": "lib/knockout-2.2.1",
    "q": "lib/q"
  },
  shim: {
    "bootstrap": {
      deps: ["jquery"],
      exports: "$.fn.popover"
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

define('bing_maps_api', ["async!http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0!onscriptload"], function() {
  return Microsoft;
});

define('google_maps_api', ['async!http://maps.google.com/maps/api/js?v=3&sensor=false'], function() {
  return google;
});

require(['jquery', 'knockout', 'bootstrap', './mapcontainer', './navbarModel'], function($, ko, bootstrap, mapContainer, NavbarModel) {
  mapContainer.initialize(require)
  .done();
  var navbarModel = new NavbarModel();
  ko.applyBindings(navbarModel, $('.navbar').get(0));
  // TODO: Not sure this is the best place to wire this up but I don't see any better options at the moment
  $('#searchBox').typeahead({
    source: navbarModel.waypointTypeaheadSource,
    updater: navbarModel.waypointTypeaheadUpdater,
    minLength: 3
  });
});
