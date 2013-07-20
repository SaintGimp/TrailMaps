/*global define: false*/
/*global trailMaps: false*/

define(['jquery', 'knockout', 'q'], function($, ko, Q) {
  return function() {
    var self = this;

    self.name = ko.observable();

    self.fromJS = function(data) {
      self.id = data._id;
      self.name(data.name);
      self.latitude = data.loc[1];
      self.longitude = data.loc[0];
      self.seq = data.seq;
    };

    self.toJS = function() {
      return {
        name: self.name(),
        loc: [self.longitude, self.latitude],
        seq: self.seq,
        _id: self.id,
      };
    };

    self.displayOnMap = function() {
      var url = 'maps/bing?lat=' + self.latitude.toFixed(5) + '&lon=' + self.longitude.toFixed(5) + '&zoom=15';
      window.location.assign(url);
    };

    self.isEditing = ko.observable(false);

    self.originalValues = null;

    self.edit = function() {
      self.originalValues = self.toJS();
      self.isEditing(true);
    };

    self.confirmEdit = function() {
      var deferred = Q.defer();

      $.ajax({
        type: 'PUT',
        url: "/api/trails/pct/waypoints/" + self.id,
        data: JSON.stringify(self.toJS()),
        processData: false,
        contentType: "application/json; charset=utf-8",
        success: function() {
          self.isEditing(false);
          deferred.resolve(true);
        },
        error: function() {
          deferred.resolve(false);
        }
      });

      return deferred.promise;
    };

    self.cancelEdit = function() {
      self.fromJS(self.originalValues);
      self.isEditing(false);
    };

    self.delete = function() {
      var deferred = Q.defer();

      $.ajax({
        type: 'DELETE',
        url: "/api/trails/pct/waypoints/" + self.id,
        success: function() {
          deferred.resolve(true);
        },
        error: function() {
          deferred.resolve(false);
        }
      });

      return deferred.promise;
    };
  };
});
