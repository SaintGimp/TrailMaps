/*global define: false*/

define(['./trailmaps', 'bing_maps_api'], function(trailmaps, Microsoft) {
  var bingMap;
  var previousPolyLine;
  var previousMileMarkerCollection;

  var mileMarkerContent =
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">' +
      '<polygon points="2,7 7,2 12,7 7,12" style="fill:red;stroke:blue;stroke-width:4" />' +
      '<text x="22" y="12" fill="white" style="font-size:14;font-family:arial;font-weight:bold">%MILE%</text>' +
    '</svg>';

  function initialize(latitude, longitude, zoomLevel, onViewChanged, callback) {
    // http://msdn.microsoft.com/en-us/library/gg427609.aspx
    Microsoft.Maps.loadModule('Microsoft.Maps.Themes.BingTheme', { callback: function() {
      bingMap = new Microsoft.Maps.Map(document.getElementById("bing-maps"), {
        credentials: "AiiVGjRyDyDynh0IbGjn7u4ee-6U9F-ZyjnRj5wYEFp_J6kq5HGcMfdd-TYE_6xF",
        center: new Microsoft.Maps.Location(latitude, longitude),
        mapTypeId: Microsoft.Maps.MapTypeId.aerial,
        zoom: zoomLevel,
        enableClickableLogo: false,
        enableSearchLogo: false,
        inertiaIntensity: 0.5,
        tileBuffer: 1,
        showBreadcrumb: false,
        theme: new Microsoft.Maps.Themes.BingTheme()
      });

      Microsoft.Maps.Events.addHandler(bingMap, 'viewchangeend', onViewChanged);

      callback();
    }});
  }

  function displayTrack(trail) {
    var vertices = [];
    $.each(trail.track, function (i, point) {
      vertices.push(new Microsoft.Maps.Location(point.loc[1], point.loc[0]));
    });

    var polyLine = new Microsoft.Maps.Polyline(vertices, null);

    // First add new track, then remove old track
    bingMap.entities.push(polyLine);
    if (previousPolyLine) {
      bingMap.entities.remove(previousPolyLine);
    }
    previousPolyLine = polyLine;
  }

  function displayMileMarkers(trail) {
    var newMileMarkerCollection = new Microsoft.Maps.EntityCollection({ visible: true });
    $.each(trail.mileMarkers, function (i, mileMarker) {
      var location = new Microsoft.Maps.Location(mileMarker.loc[1], mileMarker.loc[0]);
      // THe behavior of the Bing control is a little wacked. You'd think that specifying the text and textoffset
      // would be sufficient but it doesn't work right, so we have to go with htmlContent instead. You'd
      // also think that now the icon property wouldn't be needed but you'd be wrong again.
      var options = {
        icon: "this apparently has to be truthy or we'll get a default icon instead of the htmlContent, boo!",
        htmlContent: mileMarkerContent.replace("%MILE%", mileMarker.mile),
        typeName: 'labelPin',
        width: 75,
        anchor: new Microsoft.Maps.Point(7, 7),
      };
      newMileMarkerCollection.push(new Microsoft.Maps.Pushpin(location, options));
    });

    bingMap.entities.push(newMileMarkerCollection);
    if (previousMileMarkerCollection) {
      bingMap.entities.remove(previousMileMarkerCollection);
    }
    previousMileMarkerCollection = newMileMarkerCollection;
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
