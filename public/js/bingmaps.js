define(["trailmaps", "bing_maps_api"], function (trailmaps, Microsoft) {
  let bingMap;
  let trackLayer;
  let previousPolyLine;
  let previousMileMarkerLayer;

  const mileMarkerContent =
    "<svg xmlns='http://www.w3.org/2000/svg' width='75' height='14'>" +
    "<polygon points='2,7 7,2 12,7 7,12' style='fill:red;stroke:blue;stroke-width:4' />" +
    "<text x='22' y='12' fill='white' style='font-size:14;font-family:arial;font-weight:bold'>%MILE%</text>" +
    "</svg>";

  function initialize(container, center, zoomLevel, onViewChanged) {
    return new Promise((resolve) => {
      // http://msdn.microsoft.com/en-us/library/gg427609.aspx
      bingMap = new Microsoft.Maps.Map(container, {
        credentials: "AiiVGjRyDyDynh0IbGjn7u4ee-6U9F-ZyjnRj5wYEFp_J6kq5HGcMfdd-TYE_6xF",
        center: new Microsoft.Maps.Location(center.latitude, center.longitude),
        mapTypeId: Microsoft.Maps.MapTypeId.aerial,
        zoom: zoomLevel,
        enableClickableLogo: false,
        enableSearchLogo: false,
        inertiaIntensity: 0.5,
        tileBuffer: 1,
        showBreadcrumb: false
      });

      Microsoft.Maps.Events.addHandler(bingMap, "viewchangeend", onViewChanged);
      trackLayer = new Microsoft.Maps.Layer();
      bingMap.layers.insert(trackLayer);

      resolve();
    });
  }

  function displayTrack(track) {
    const vertices = [];
    track.forEach(function (point) {
      vertices.push(new Microsoft.Maps.Location(point.loc[1], point.loc[0]));
    });

    const polyLine = new Microsoft.Maps.Polyline(vertices, {
      strokeColor: "red",
      strokeThickness: 3
    });

    // First add new track, then remove old track
    trackLayer.add(polyLine);
    if (previousPolyLine) {
      trackLayer.remove(previousPolyLine);
    }
    previousPolyLine = polyLine;
  }

  function displayMileMarkers(mileMarkers) {
    const newMileMarkerLayer = new Microsoft.Maps.Layer();
    mileMarkers.forEach(function (mileMarker) {
      const location = new Microsoft.Maps.Location(mileMarker.loc[1], mileMarker.loc[0]);
      const options = {
        icon: mileMarkerContent.replace("%MILE%", mileMarker.mile),
        anchor: new Microsoft.Maps.Point(7, 7)
      };
      newMileMarkerLayer.add(new Microsoft.Maps.Pushpin(location, options));
    });

    bingMap.layers.insert(newMileMarkerLayer);
    if (previousMileMarkerLayer) {
      bingMap.layers.remove(previousMileMarkerLayer);
    }
    previousMileMarkerLayer = newMileMarkerLayer;
  }

  function getCenter() {
    const center = bingMap.getCenter();
    return new trailmaps.Location(center.latitude, center.longitude);
  }

  function getBounds() {
    const bounds = bingMap.getBounds();
    return new trailmaps.Rectangle(
      new trailmaps.Location(bounds.center.latitude, bounds.center.longitude),
      bounds.width,
      bounds.height
    );
  }

  function getZoom() {
    return bingMap.getZoom();
  }

  function getCenterAndZoom() {
    const center = bingMap.getCenter();
    return {
      center: {
        latitude: center.latitude,
        longitude: center.longitude
      },
      zoom: bingMap.getZoom()
    };
  }

  function setCenterAndZoom(options) {
    const viewOptions = bingMap.getOptions();
    viewOptions.center = new Microsoft.Maps.Location(options.center.latitude, options.center.longitude);
    viewOptions.zoom = options.zoom;
    bingMap.setView(viewOptions);
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
