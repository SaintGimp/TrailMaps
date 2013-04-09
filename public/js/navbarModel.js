/*global define: false*/

define(['jquery', 'mapcontainer', 'knockout'], function($, mapContainer, ko) {
  return function() {
    var self = this;

    self.searchText = ko.observable();

    self.gotoWaypoint = function() {
      var url = "/api/trails/pct/milemarkers/" + self.searchText();
      $.getJSON(url, function(result) {
          mapContainer.setCenterAndZoom({
            center: {
              latitude: result.loc[1],
              longitude: result.loc[0]
            },
            zoom: 14
          });
      });
    };

    self.showMap = function(data, event) {
      // TODO: We used to have to force tabs to be shown here before Google got inited otherwise
      // it would freak out. That seems to be no longer the case after implementing require.js,
      // but I'm not sure if it works only due to timing or what.  Keep on eye on this.
      mapContainer.showingMap(event.target.hash);
    };
  };
});
