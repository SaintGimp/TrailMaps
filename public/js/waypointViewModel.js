/*global define: false*/
/*global trailMaps: false*/

define(['jquery', 'knockout', 'q'], function($, ko, Q) {
  return function() {
    var self = this;

    self.fromJS = function(data) {
      self.id = data._id;
      self.name = ko.observable(data.name);
      self.latitude = ko.observable(data.loc[1]);
      self.longitude = ko.observable(data.loc[0]);
    };

    self.toJS = function() {
      return {
        name: self.name(),
        loc: [self.longitude(), self.latitude()],
        _id: self.id
      };
    };

    self.displayOnMap = function() {
      var url = 'maps/bing?lat=' + self.latitude() + '&lon=' + self.longitude() + '&zoom=15';
      window.location.assign(url);
    };

    self.edit = function() {
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
