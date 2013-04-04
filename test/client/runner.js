/*global Microsoft: false*/
/*global google: false*/
/*global nokia: false*/

// TODO: share this somehow with main.js

requirejs.config({
  baseUrl: "/js",
  paths: {
    "jquery" : "https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min",
    "bootstrap": "../bootstrap/js/bootstrap.min",
    "async": "lib/async",
    "markerwithlabel": "lib/markerwithlabel_packed",
    "here_maps_api": "http://api.maps.nokia.com/2.2.4/jsl.js?with=maps",
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

expect = chai.expect;

require(['jquery'], function($) {
  var specs = [];

  specs.push('mapcontainertest.js');

  mocha.setup({
    ui: "bdd",
    globals: [
      '__async_req_1__',
      '$MapsNamespace',
      'Microsoft',
      'g',
      'PRF',
      'microsoftMapsNetworkCallback',
      'styleKey',
      '_scaleBarMiElement'
  ]});

  $(function() {
    require(specs, function() {

      beforeEach(function() {
        $('#testArea').remove();
        $('body').append('<div id="testArea" style="width:400px; height:200px; border:solid red 2px"></div>');
      });

      afterEach(function() {
        $('#testArea').remove();
      });

      mocha.run();
    });
  });
});