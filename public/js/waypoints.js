/*global Microsoft: false*/
/*global google: false*/
/*global nokia: false*/
/*global trailMaps: false*/

requirejs.config({
  baseUrl: "/js",
  paths: {
    "jquery" : "https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min",
    "bootstrap": "../bootstrap/js/bootstrap.min",
    "knockout": "http://ajax.aspnetcdn.com/ajax/knockout/knockout-2.2.1",
    "knockout.mapping": "http://cdnjs.cloudflare.com/ajax/libs/knockout.mapping/2.3.5/knockout.mapping",
    "q": "lib/q"
  },
  shim: {
    "bootstrap": {
      deps: ["jquery"],
      exports: "$.fn.popover"
    }
  },
});

require(['jquery', 'knockout', 'bootstrap', './waypointsViewModel'], function($, ko, bootstrap, WaypointsViewModel) {
  var waypointsViewModel = new WaypointsViewModel();
  waypointsViewModel.loadData()
  .done(function() {
    ko.applyBindings(waypointsViewModel, $('#waypoints').get(0));
  });
});
