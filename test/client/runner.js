/* global Microsoft:false */
/* global google:false */
/* global requirejs:false */
/* global chai:false */
/* global expect:true */
/* exported expect */
/* global trailMaps:true */
/* exported trailMaps */

// TODO: share this somehow with main.js

if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    },
    configurable: true,
    writable: true
  });
}

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
  specs.push("createWaypoint_test.js");

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