/*global define: false*/

define(["q", "trailmaps", "here_maps_api"], function(Q, trailmaps, H) {
  var hereMap;
  var previousPolyLine;
  var previousMileMarkerCollection;

  var mileMarkerContent =
    "<svg width='50' height='50' xmlns='http://www.w3.org/2000/svg' version='1.1'>" +
      "<polygon points='2,7 7,2 12,7 7,12' style='fill:red;stroke:blue;stroke-width:4' />" +
      "<text x='22' y='12' fill='white' style='font-size:15;font-family:arial;font-weight:bold'>%MILE%</text>" +
    "</svg>";

  function initialize(container, center, zoomLevel, onViewChanged) {
    var deferred = Q.defer();

    var platform = new H.service.Platform({
      'app_id': trailMaps.configuration.hereApiId,
      'app_code': trailMaps.configuration.hereApiCode,
    });

    var defaultLayers = platform.createDefaultLayers();
    hereMap = new H.Map(
      container,
      defaultLayers.satellite.map,
      {
        zoom: zoomLevel,
        center: { lat: center.latitude, lng: center.longitude }
      }
    );
    hereMap.addEventListener("mapviewchangeend", onViewChanged);
    var ui = H.ui.UI.createDefault(hereMap, defaultLayers);
    var mapEvents = new H.mapevents.MapEvents(hereMap);
    var behavior = new H.mapevents.Behavior(mapEvents);

    deferred.resolve();

    return deferred.promise;
  }

  function displayTrack(track) {
    var linestring = new H.geo.LineString();
    $.each(track, function (i, point) {
      linestring.pushPoint({lat: point.loc[1], lng: point.loc[0]});
    });

    var polyLine = new H.map.Polyline(linestring, { style: { strokeColor: "#FF0000", lineWidth: 3 }});

    // First add new track, then remove old track
    hereMap.addObject(polyLine);
    if (previousPolyLine) {
      hereMap.removeObject(previousPolyLine);
    }
    previousPolyLine = polyLine;
  }

  function displayMileMarkers(mileMarkers) {
    var newMileMarkerCollection = [];
    $.each(mileMarkers, function (i, mileMarker) {
      var markerText = mileMarkerContent.replace("%MILE%", mileMarker.mile);
      var icon = new H.map.Icon(markerText, {anchor: { x: 7, y: 7 }});
      var coordinates = {lat: mileMarker.loc[1], lng: mileMarker.loc[0]};
      var marker = new H.map.Marker(coordinates, {icon: icon});
        
      newMileMarkerCollection.push(marker);
    });

    hereMap.addObjects(newMileMarkerCollection);
    if (previousMileMarkerCollection) {
      hereMap.removeObjects(previousMileMarkerCollection);
    }
    previousMileMarkerCollection = newMileMarkerCollection;
  }

  function getCenter() {
    var center = hereMap.getCenter();
    return new trailmaps.Location(center.lat, center.lng);
  }

  function getBounds() {
    var bounds = hereMap.getViewBounds();
    var center = bounds.getCenter();
    return new trailmaps.Rectangle(new trailmaps.Location(center.lat, center.lng), bounds.getWidth(), bounds.getHeight());
  }

  function getZoom() {
    return hereMap.getZoom();
  }

  function getCenterAndZoom() {
    var center = hereMap.getCenter();
    return {
      center: {
        latitude: center.lat,
        longitude: center.lng
      },
      zoom: hereMap.getZoom()
    };
  }

  function setCenterAndZoom(options) {
    var mapCenter = {lat: options.center.latitude, lng: options.center.longitude};
    hereMap.setCenter(mapCenter);
    hereMap.setZoom(options.zoom);
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
