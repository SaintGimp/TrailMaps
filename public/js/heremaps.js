/*global define: false*/

define(['./trailmaps', 'here_maps_api'], function(trailmaps, nokia) {
  // TODO: check out http://jhere.net/
  var hereMap;
  var previousPolyLine;
  var previousMileMarkerCollection;

  var mileMarkerContent =
    '<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg" version="1.1">' +
      '<polygon points="2,7 7,2 12,7 7,12" style="fill:red;stroke:blue;stroke-width:4" />' +
      '<text x="22" y="12" fill="white" style="font-size:15;font-family:arial;font-weight:bold">%MILE%</text>' +
    '</svg>';

  function initialize(latitude, longitude, zoomLevel, onViewChanged, callback) {
    nokia.Settings.set("appId", "63ii-nsJjiF97C-K3jqU");
    nokia.Settings.set("authenticationToken", "FTtFzF5jfEr7iRYgv6tEgg");

    var featureMap = nokia.Features.getFeaturesFromMatrix(["maps"]);
    nokia.Features.load(featureMap, function() {
      hereMap = new nokia.maps.map.Display(document.getElementById("here-maps"), {
        baseMapType: nokia.maps.map.Display.SATELLITE,
        components: [
          new nokia.maps.map.component.Behavior(),
          new nokia.maps.map.component.ZoomBar(),
          //new nokia.maps.map.component.Overview(),
          new nokia.maps.map.component.OverlaysSelector(),
          new nokia.maps.map.component.TypeSelector(),
          new nokia.maps.map.component.ScaleBar()
        ],
        center: [latitude, longitude],
        zoomLevel: zoomLevel
      });

      hereMap.addListener("mapviewchangeend", onViewChanged, true);

      callback();
    });
  }

  function displayTrack(trail) {
    var vertices = [];
    $.each(trail.track, function (i, point) {
      vertices.push(new nokia.maps.geo.Coordinate(point.loc[1], point.loc[0]));
    });

    var polyLine = new nokia.maps.map.Polyline(
      vertices,
      {
        pen: {
          strokeColor: "#FF0000",
          lineWidth: 3
        }
      }
    );

    // First add new track, then remove old track
    hereMap.objects.add(polyLine);
    if (previousPolyLine) {
      hereMap.objects.remove(previousPolyLine);
    }
    previousPolyLine = polyLine;
  }

  function displayMileMarkers(trail) {
    var newMileMarkerCollection = [];
    $.each(trail.mileMarkers, function (i, mileMarker) {
      var location = new nokia.maps.geo.Coordinate(mileMarker.loc[1], mileMarker.loc[0]);
      var options = {
        icon: mileMarkerContent.replace("%MILE%", mileMarker.mile),
        anchor: { x: 7, y: 7 }
      };
      newMileMarkerCollection.push(new nokia.maps.map.Marker(location, options));
    });

    hereMap.objects.addAll(newMileMarkerCollection);
    if (previousMileMarkerCollection) {
      hereMap.objects.removeAll(previousMileMarkerCollection);
    }
    previousMileMarkerCollection = newMileMarkerCollection;
  }

  function getCenter() {
    var center = hereMap.center;
    return new trailmaps.Location(center.latitude, center.longitude);
  }

  function getBounds() {
    var bounds = hereMap.getViewBounds();
    var center = bounds.getCenter();
    return new trailmaps.Rectangle(new trailmaps.Location(center.latitude, center.longitude), bounds.getWidth(), bounds.getHeight());
  }

  function getZoom() {
    return hereMap.zoomLevel;
  }

  function getCenterAndZoom() {
    var center = hereMap.center;
    return {
      center: {
        latitude: center.latitude,
        longitude: center.longitude
      },
      zoom: hereMap.zoomLevel
    };
  }

  function setCenterAndZoom(options) {
    var mapCenter = new nokia.maps.geo.Coordinate(options.center.latitude, options.center.longitude);
    hereMap.setCenter(mapCenter);
    hereMap.setZoomLevel(options.zoom);
  }

  return {
    initialize: initialize,
    displayTrack: displayTrack,
    displayMileMarkers: displayMileMarkers,
    getCenter: getCenter,
    getBounds: getBounds,
    getZoom: getZoom,
    getCenterAndZoom: getCenterAndZoom,
    setCenterAndZoom: setCenterAndZoom
  };
});
