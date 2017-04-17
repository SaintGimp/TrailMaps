/*global define: false*/

define(["jquery", "knockout", "q"], function($, ko, Q) {
  return function(mapContainer) {
    var self = this;
    self.mapContainer = mapContainer;

    $('#createWaypointDialog').on('show.bs.modal', function () {
      self.waypointName("");
    });
    $('#createWaypointDialog').on('shown.bs.modal', function () {
      $('#newWaypointName').focus();
    });

    self.waypointName = ko.observable("");

    self.create = function() {
      var deferred = Q.defer();
      
      $.ajax({
        type: "POST",
        url: "/api/trails/pct/waypoints",
        data: JSON.stringify(self.toJS()),
        processData: false,
        contentType: "application/json; charset=utf-8",
        success: function() {
          self.hide();
          deferred.resolve(true);
        },
        error: function() {
          self.hide();
          deferred.resolve(false);
        }
      });

      return deferred.promise;
    };

    self.toJS = function() {
      var viewOptions = mapContainer.getViewOptions();
      return {
        name: self.waypointName(),
        loc: [viewOptions.view.center.longitude, viewOptions.view.center.latitude]
      };
    };

    self.hide = function() {
      if ($('#createWaypointDialog').modal) {
        $('#createWaypointDialog').modal('hide');
      }
    }
  }
});
