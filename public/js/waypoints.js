/*global Microsoft: false*/
/*global google: false*/
/*global nokia: false*/
/*global trailMaps: false*/

requirejs.config({
  baseUrl: "/js",
  paths: {
    "jquery" : "https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min",
    "bootstrap": "http://netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min",
    "knockout": "http://cdnjs.cloudflare.com/ajax/libs/knockout/3.1.0/knockout-min",
    "knockout.mapping": "http://cdnjs.cloudflare.com/ajax/libs/knockout.mapping/2.4.1/knockout.mapping",
    "q": "lib/q"
  },
  shim: {
    "bootstrap": {
      deps: ["jquery"],
      exports: "$.fn.popover"
    }
  },
});

require(['jquery', 'knockout', 'bootstrap', 'waypointsViewModel', 'knockoutBindingHandlers'], function($, ko, bootstrap, WaypointsViewModel) {
  var waypointsViewModel = new WaypointsViewModel();
  waypointsViewModel.loadData()
  .done(function() {
    ko.applyBindings(waypointsViewModel, $('#waypoints').get(0));
  });
});
