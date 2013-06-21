/*global define: false*/
/*global trailMaps: false*/

define(['jquery', 'mapcontainer', 'knockout', 'history'], function($, mapContainer, ko, history) {
  return function() {
    var self = this;

    self.activeMapName = ko.observable(trailMaps.configuration.defaultMapName.toLowerCase());
    mapContainer.addViewChangedListener(function() {
      replaceCurrentHistoryNode();
    });
    
    self.onPillClick = function(data, event) {
      var href = event.target.href;
      var mapName = href.substr(href.lastIndexOf('/') + 1, href.length).toLowerCase();

      if (mapName !== self.activeMapName())
      {
        showMap(mapName);
      }

      return false;
    };

    function showMap(mapName) {
      mapName = mapName.toLowerCase();
      self.activeMapName(mapName);
      mapContainer.showingMap(mapName)
      .done();
    }

    self.restoreHistoryState = function(options) {
      showMap(options.mapName);
      mapContainer.setCenterAndZoom(options.view);
    };

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
            changeMapView({
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
      changeMapView({
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
            changeMapView({
              center: {
                latitude: result.loc[1],
                longitude: result.loc[0]
              },
              zoom: 14
            });
          }
      });
    }

    function changeMapView(options) {
      replaceCurrentHistoryNode();
      mapContainer.setCenterAndZoom(options);
      addNewHistoryNode();
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

    self.initializeBrowserHistory = function() {
      replaceCurrentHistoryNode();
    };

    function replaceCurrentHistoryNode() {
      var url = mapContainer.getUrlFragment();
      history.replaceState(mapContainer.getViewOptions(), null, url);
    }

    function addNewHistoryNode() {
      var url = mapContainer.getUrlFragment();
      history.pushState(mapContainer.getViewOptions(), null, url);
    }
  };
});
