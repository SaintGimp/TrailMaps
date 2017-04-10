define(['q', 'trailmaps', 'bing_maps_api'], function(Q, trailmaps, Microsoft) {
  var bingMap;
  var trackLayer;
  var previousPolyLine;
  var previousMileMarkerLayer;

  var mileMarkerContent =
    '<svg xmlns="http://www.w3.org/2000/svg" width="75" height="14">' +
      '<polygon points="2,7 7,2 12,7 7,12" style="fill:red;stroke:blue;stroke-width:4" />' +
      '<text x="22" y="12" fill="white" style="font-size:14;font-family:arial;font-weight:bold">%MILE%</text>' +
    '</svg>';

  function initialize(container, center, zoomLevel, onViewChanged) {
    var deferred = Q.defer();

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
      showBreadcrumb: false,
      });

    Microsoft.Maps.Events.addHandler(bingMap, 'viewchangeend', onViewChanged);
    trackLayer = new Microsoft.Maps.Layer();
    bingMap.layers.insert(trackLayer);

    deferred.resolve();
    return deferred.promise;
  }

  function displayTrack(track) {
    var vertices = [];
    $.each(track, function (i, point) {
      vertices.push(new Microsoft.Maps.Location(point.loc[1], point.loc[0]));
    });

    var polyLine = new Microsoft.Maps.Polyline(vertices, {
            strokeColor: 'red',
            strokeThickness: 3,
    });

    // First add new track, then remove old track
    trackLayer.add(polyLine);
    if (previousPolyLine) {
      trackLayer.remove(previousPolyLine);
    }
    previousPolyLine = polyLine;
  }

  function displayMileMarkers(mileMarkers) {
    var newMileMarkerLayer = new Microsoft.Maps.Layer();
    $.each(mileMarkers, function (i, mileMarker) {
      var location = new Microsoft.Maps.Location(mileMarker.loc[1], mileMarker.loc[0]);
      var options = {
        icon: mileMarkerContent.replace("%MILE%", mileMarker.mile),
        anchor: new Microsoft.Maps.Point(7, 7),
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
    var center = bingMap.getCenter();
    return new trailmaps.Location(center.latitude, center.longitude);
  }

  function getBounds() {
    var bounds = bingMap.getBounds();
    return new trailmaps.Rectangle(new trailmaps.Location(bounds.center.latitude, bounds.center.longitude), bounds.width, bounds.height);
  }

  function getZoom() {
    return bingMap.getZoom();
  }

  function getCenterAndZoom() {
    var center = bingMap.getCenter();
    return {
      center: {
        latitude: center.latitude,
        longitude: center.longitude
      },
      zoom: bingMap.getZoom()
    };
  }

  function setCenterAndZoom(options) {
    var viewOptions = bingMap.getOptions();
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
