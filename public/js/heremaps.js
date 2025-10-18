/*global define: false*/
/*global trailMaps: false*/

define(["trailmaps", "here_maps_api"], function (trailmaps, H) {
  let hereMap;
  let previousPolyLine;
  let previousMileMarkerCollection;

  const mileMarkerContent =
    "<svg width='50' height='50' xmlns='http://www.w3.org/2000/svg' version='1.1'>" +
    "<polygon points='2,7 7,2 12,7 7,12' style='fill:red;stroke:blue;stroke-width:4' />" +
    "<text x='22' y='12' fill='white' style='font-size:15;font-family:arial;font-weight:bold'>%MILE%</text>" +
    "</svg>";

  function initialize(container, center, zoomLevel, onViewChanged) {
    return new Promise((resolve) => {
      const platform = new H.service.Platform({
        app_id: trailMaps.configuration.hereApiId,
        app_code: trailMaps.configuration.hereApiCode
      });

      const defaultLayers = platform.createDefaultLayers();
      hereMap = new H.Map(container, defaultLayers.satellite.map, {
        zoom: zoomLevel,
        center: { lat: center.latitude, lng: center.longitude }
      });
      hereMap.addEventListener("mapviewchangeend", onViewChanged);
      H.ui.UI.createDefault(hereMap, defaultLayers);
      const mapEvents = new H.mapevents.MapEvents(hereMap);
      new H.mapevents.Behavior(mapEvents);

      resolve();
    });
  }

  function displayTrack(track) {
    const linestring = new H.geo.LineString();
    track.forEach(function (point) {
      linestring.pushPoint({ lat: point.loc[1], lng: point.loc[0] });
    });

    const polyLine = new H.map.Polyline(linestring, { style: { strokeColor: "#FF0000", lineWidth: 3 } });

    // First add new track, then remove old track
    hereMap.addObject(polyLine);
    if (previousPolyLine) {
      hereMap.removeObject(previousPolyLine);
    }
    previousPolyLine = polyLine;
  }

  function displayMileMarkers(mileMarkers) {
    const newMileMarkerCollection = [];
    mileMarkers.forEach(function (mileMarker) {
      const markerText = mileMarkerContent.replace("%MILE%", mileMarker.mile);
      const icon = new H.map.Icon(markerText, { anchor: { x: 7, y: 7 } });
      const coordinates = { lat: mileMarker.loc[1], lng: mileMarker.loc[0] };
      const marker = new H.map.Marker(coordinates, { icon: icon });

      newMileMarkerCollection.push(marker);
    });

    hereMap.addObjects(newMileMarkerCollection);
    if (previousMileMarkerCollection) {
      hereMap.removeObjects(previousMileMarkerCollection);
    }
    previousMileMarkerCollection = newMileMarkerCollection;
  }

  function getCenter() {
    const center = hereMap.getCenter();
    return new trailmaps.Location(center.lat, center.lng);
  }

  function getBounds() {
    const bounds = hereMap.getViewBounds();
    const center = bounds.getCenter();
    return new trailmaps.Rectangle(
      new trailmaps.Location(center.lat, center.lng),
      bounds.getWidth(),
      bounds.getHeight()
    );
  }

  function getZoom() {
    return hereMap.getZoom();
  }

  function getCenterAndZoom() {
    const center = hereMap.getCenter();
    return {
      center: {
        latitude: center.lat,
        longitude: center.lng
      },
      zoom: hereMap.getZoom()
    };
  }

  function setCenterAndZoom(options) {
    const mapCenter = { lat: options.center.latitude, lng: options.center.longitude };
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
