/*global define: false*/

define(['jquery', 'mapcontainer', 'knockout'], function($, mapContainer, ko) {
  return function() {
    var self = this;

    self.searchText = ko.observable();

    self.search = function() {
      var searchText = self.searchText();
      if (isCoordinates(searchText)) {
        gotoCoordinates(searchText);
      } else if (isMileMarker(searchText)) {
        gotoMileMarker(searchText);
      } else {
        gotoWaypoint(searchText);
      }

    };

    self.showMap = function(data, event) {
      // TODO: We used to have to force tabs to be shown here before Google got inited otherwise
      // it would freak out. That seems to be no longer the case after implementing require.js,
      // but I'm not sure if it works only due to timing or what.  Keep on eye on this.
      mapContainer.showingMap(event.target.hash)
      .done();
    };

    self.waypointTypeaheadSource = function(query, process) {
      if (isWaypoint(query)) {
        var url = "/api/trails/pct/waypoints/typeahead/" + encodeURIComponent(query);
        return $.getJSON(url, null, function (data) {
         return process(data);
        });
      }
    };

    self.waypointTypeaheadUpdater = function(item) {
      self.searchText(item);
      self.search();
      return item;
    };

    self.coordinatesRegex = /^-?\d*\.?\d+,\s*-?\d*\.?\d+$/;
    self.numberRegex = /-?\d*\.?\d+/g;
    self.mileMarkerRegex = /^\d*\.?\d?$/;

    function gotoMileMarker(mileMarker) {
      var url = "/api/trails/pct/milemarkers/" + mileMarker;
      $.getJSON(url, function(result) {
          if (result) {
            mapContainer.setCenterAndZoom({
              center: {
                latitude: result.loc[1],
                longitude: result.loc[0]
              },
              zoom: 14
            });
          }
      });
    }

    function gotoCoordinates(location) {
      var numbers = location.match(self.numberRegex);
      mapContainer.setCenterAndZoom({
        center: {
          latitude: parseFloat(numbers[0]),
          longitude: parseFloat(numbers[1])
        },
        zoom: 14
      });
    }

    function gotoWaypoint(waypoint) {
      var url = "/api/trails/pct/waypoints/" + encodeURIComponent(waypoint);
      $.getJSON(url, function(result) {
          if (result) {
            mapContainer.setCenterAndZoom({
              center: {
                latitude: result.loc[1],
                longitude: result.loc[0]
              },
              zoom: 14
            });
          }
      });
    }

    function isCoordinates(text) {
      return text.match(self.coordinatesRegex);
    }

    function isMileMarker(text) {
      return text.match(self.mileMarkerRegex);
    }

    function isWaypoint(text) {
      return !isCoordinates(text) && !isMileMarker(text);
    }
  };
});
