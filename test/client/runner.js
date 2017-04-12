/* global Microsoft:false */
/* global google:false */
/* global requirejs:false */
/* global chai:false */
/* global expect:true */
/* global trailMaps:true */

// TODO: share this somehow with main.js

requirejs.config({
  baseUrl: "/js",
  paths: {
    "jquery" : "https://code.jquery.com/jquery-2.1.3.min",
    "bootstrap": "http://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min",
    "async": "lib/async",
    "markerwithlabel": "lib/markerwithlabel_packed",
    "here_maps_api": "http://api.maps.nokia.com/2.2.4/jsl.js?with=maps",
    "knockout": "https://cdnjs.cloudflare.com/ajax/libs/knockout/3.3.0/knockout-min",
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

define("bing_maps_api", ["async!http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0!onscriptload"], function() {
  return Microsoft;
});

define("google_maps_api", ["async!http://maps.google.com/maps/api/js?v=3&sensor=false"], function() {
  return google;
});

expect = chai.expect;

// Defaults that would usually be set in the view
trailMaps = {
  configuration: {
    defaultMapName: "bing",
    defaultLatitude: 40.50642708521896,
    defaultLongitude: -121.36087699433327,
    defaultZoom: 5
  }
};

require(["jquery"], function($) {
  var specs = [];

  specs.push("mapcontainer_test.js");
  specs.push("navbar_test.js");
  specs.push("waypoints_test.js");

  mocha.setup({
    ui: "bdd",
    globals: [
      "__async_req_1__",
      "$MapsNamespace",
      "Microsoft",
      "g",
      "PRF",
      "microsoftMapsNetworkCallback",
      "styleKey",
      "_scaleBarMiElement",
      "lastpass_iter",
      "lastpass_f",
      "trailMaps"
    ]
  });

  $(function() {
    require(specs, function() {
      mocha.run();
    });
  });
});