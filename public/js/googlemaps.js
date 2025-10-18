/*global define: false*/
/*global MarkerWithLabel: false*/

define(["trailmaps", "google_maps_api", "markerwithlabel"], function (trailmaps, google) {
  let googleMap;
  let previousPolyLine;
  const mileMarkerCollection = [];

  function initialize(container, center, zoomLevel, onViewChanged) {
    return new Promise((resolve) => {
      // https://developers.google.com/maps/documentation/javascript/
      const mapOptions = {
        center: new google.maps.LatLng(center.latitude, center.longitude),
        zoom: zoomLevel,
        mapTypeId: google.maps.MapTypeId.HYBRID
      };
      googleMap = new google.maps.Map(container, mapOptions);

      google.maps.event.addListenerOnce(googleMap, "idle", function () {
        resolve();
        google.maps.event.addListener(googleMap, "idle", onViewChanged);
      });
    });
  }

  function displayTrack(track) {
    const vertices = [];
    track.forEach(function (point) {
      vertices.push(new google.maps.LatLng(point.loc[1], point.loc[0]));
    });

    const polyLine = new google.maps.Polyline({
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

  function displayMileMarkers(mileMarkers) {
    mileMarkerCollection.forEach(function (marker) {
      marker.setMap(null);
    });
    mileMarkerCollection.length = 0;

    // TODO: I'd like to use an SVG marker but Google maps doesn't make that
    // easy to implement right now in v3.
    const icon = {
      url: "/images/mile_marker.png",
      anchor: new google.maps.Point(12, 12)
    };

    mileMarkers.forEach(function (mileMarker) {
      const location = new google.maps.LatLng(mileMarker.loc[1], mileMarker.loc[0]);
      const options = {
        position: location,
        draggable: false,
        raiseOnDrag: false,
        map: googleMap,
        labelContent: mileMarker.mile.toString(),
        labelAnchor: new google.maps.Point(-13, 10),
        labelClass: "milemarker_text",
        icon: icon
      };
      const newMileMarker = new MarkerWithLabel(options);
      mileMarkerCollection.push(newMileMarker);
    });
  }

  function getCenter() {
    const center = googleMap.getCenter();
    return new trailmaps.Location(center.lat(), center.lng());
  }

  function getBounds() {
    const bounds = googleMap.getBounds();
    const center = bounds.getCenter();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    return new trailmaps.Rectangle(
      new trailmaps.Location(center.lat(), center.lng()),
      ne.lng() - sw.lng(),
      ne.lat() - sw.lat()
    );
  }

  function getZoom() {
    return googleMap.getZoom();
  }

  function getCenterAndZoom() {
    const mapCenter = googleMap.getCenter();
    return {
      center: {
        latitude: mapCenter.lat(),
        longitude: mapCenter.lng()
      },
      zoom: googleMap.getZoom()
    };
  }

  function setCenterAndZoom(options) {
    const mapCenter = new google.maps.LatLng(options.center.latitude, options.center.longitude);
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
