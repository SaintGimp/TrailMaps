/*global define: false*/

define(['./trailmaps', 'google_maps_api', 'markerwithlabel'], function(trailmaps, google) {
  var googleMap;
  var previousPolyLine;
  var mileMarkerCollection = [];

  function initialize(latitude, longitude, zoomLevel, onViewChanged, callback) {
    // https://developers.google.com/maps/documentation/javascript/
    var mapOptions = {
      center: new google.maps.LatLng(latitude, longitude),
      zoom: zoomLevel,
      mapTypeId: google.maps.MapTypeId.HYBRID
    };
    googleMap = new google.maps.Map(document.getElementById("google-maps"), mapOptions);

    google.maps.event.addListener(googleMap, 'idle', onViewChanged);

    callback();
  }

  function displayTrack(trail) {
    var vertices = [];
    $.each(trail.track, function (i, point) {
      vertices.push(new google.maps.LatLng(point.loc[1], point.loc[0]));
    });

    var polyLine = new google.maps.Polyline({
      path: vertices,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 3
    });

    // First add new track, then remove old track
    polyLine.setMap(googleMap);
    if (previousPolyLine) {
      previousPolyLine.setMap(null);
    }
    previousPolyLine = polyLine;
  }

  function displayMileMarkers(trail) {
    mileMarkerCollection.forEach(function(marker) {
      marker.setMap(null);
    });
    mileMarkerCollection.length = 0;

    // TODO: I'd like to use an SVG marker but Google maps doesn't make that
    // easy to implement right now in v3.
    var icon = {
      url: '/images/mile_marker.png',
      anchor: new google.maps.Point(12, 12)
    };

    $.each(trail.mileMarkers, function (i, mileMarker) {
      var location = new google.maps.LatLng(mileMarker.loc[1], mileMarker.loc[0]);
      var options = {
         position: location,
         draggable: false,
         raiseOnDrag: false,
         map: googleMap,
         labelContent: mileMarker.mile.toString(),
         labelAnchor: new google.maps.Point(-13, 10),
         labelClass: "milemarker_text",
         icon: icon
      };
      var newMileMarker = new MarkerWithLabel(options);
      mileMarkerCollection.push(newMileMarker);
    });
  }

  function getCenter() {
    var center = googleMap.getCenter();
    return new trailmaps.Location(center.lat(), center.lng());
  }

  function getBounds() {
    var bounds = googleMap.getBounds();
    var center = bounds.getCenter();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    return new trailmaps.Rectangle(new trailmaps.Location(center.lat(), center.lng()), ne.lng() - sw.lng(), ne.lat() - sw.lat());
  }

  function getZoom() {
    return googleMap.getZoom();
  }

  function getCenterAndZoom(options) {
    var mapCenter = googleMap.getCenter();
    return {
      center: {
        latitude: mapCenter.lat(),
        longitude: mapCenter.lng()
      },
      zoom: googleMap.getZoom()
    };
  }

  function setCenterAndZoom(options) {
    var mapCenter = new google.maps.LatLng(options.center.latitude, options.center.longitude);
    googleMap.setCenter(mapCenter);
    googleMap.setZoom(options.zoom);
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
