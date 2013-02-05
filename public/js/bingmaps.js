/*global Microsoft: false*/

function BingMapControl() {
  var me = this;

  // TODO: the visual display of the track starts to break up as we scroll the view, before
  // we load a new track. Seems to be a Bing problem.  Maybe we should load a smaller track bounds?
  
  this.bingMap = null;
  this.previousPolyLine = null;
  this.previousMileMarkerCollection = null;
  
  this.mileMarkerContent =
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">' +
      '<polygon points="2,7 7,2 12,7 7,12" style="fill:red;stroke:blue;stroke-width:4" />' +
      '<text x="22" y="12" fill="white" style="font-size:14;font-family:arial;font-weight:bold">%MILE%</text>' +
    '</svg>';

  this.initialize = function (latitude, longitude, zoomLevel, onViewChanged) {
    // http://msdn.microsoft.com/en-us/library/gg427609.aspx
    Microsoft.Maps.loadModule('Microsoft.Maps.Themes.BingTheme', { callback: function() {
      me.bingMap = new Microsoft.Maps.Map(document.getElementById("bing-maps"), {
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

      //Microsoft.Maps.Events.addHandler(me.bingMap, 'viewchange', onViewChanged);
      Microsoft.Maps.Events.addHandler(me.bingMap, 'viewchangeend', onViewChanged);
    }});
  };

  this.displayTrack = function(trail) {
    var vertices = [];
    $.each(trail.track, function (i, point) {
      vertices.push(new Microsoft.Maps.Location(point.loc[1], point.loc[0]));
    });

    var polyLine = new Microsoft.Maps.Polyline(vertices, null);

    // First add new track, then remove old track
    me.bingMap.entities.push(polyLine);
    if (me.previousPolyLine) {
      me.bingMap.entities.remove(me.previousPolyLine);
    }
    me.previousPolyLine = polyLine;
  };

  this.displayMileMarkers = function (trail) {
    var newMileMarkerCollection = new Microsoft.Maps.EntityCollection({ visible: true });
    $.each(trail.mileMarkers, function (i, mileMarker) {
      var location = new Microsoft.Maps.Location(mileMarker.loc[1], mileMarker.loc[0]);
      // THe behavior of the Bing control is a little wacked. You'd think that specifying the text and textoffset
      // would be sufficient but it doesn't work right, so we have to go with htmlContent instead. You'd
      // also think that now the icon property wouldn't be needed but you'd be wrong again.
      var options = {
        icon: "this apparently has to be truthy or we'll get a default icon instead of the htmlContent, boo!",
        htmlContent: me.mileMarkerContent.replace("%MILE%", mileMarker.mile),
        typeName: 'labelPin',
        //height: 25,
        width: 75,
        anchor: new Microsoft.Maps.Point(7, 7),
      };
      newMileMarkerCollection.push(new Microsoft.Maps.Pushpin(location, options));
    });

    me.bingMap.entities.push(newMileMarkerCollection);
    if (me.previousMileMarkerCollection) {
      me.bingMap.entities.remove(me.previousMileMarkerCollection);
    }
    me.previousMileMarkerCollection = newMileMarkerCollection;
  };

  this.getCenter = function() {
    var center = me.bingMap.getCenter();
    return new Location(center.latitude, center.longitude);
  };

  this.getBounds = function() {
    var bounds = me.bingMap.getBounds();
    return new Rectangle(new Location(bounds.center.latitude, bounds.center.longitude), bounds.width, bounds.height);
  };

  this.getZoom = function() {
    return me.bingMap.getZoom();
  };

  this.getCenterAndZoom = function() {
    var center = me.bingMap.getCenter();
    return {
      center: {
        latitude: center.latitude,
        longitude: center.longitude
      },
      zoom: me.bingMap.getZoom()
    };
  };

  this.setCenterAndZoom = function(options) {
    var viewOptions = me.bingMap.getOptions();
    viewOptions.center = new Microsoft.Maps.Location(options.center.latitude, options.center.longitude);
    viewOptions.zoom = options.zoom;
    me.bingMap.setView(viewOptions);
  };
}

