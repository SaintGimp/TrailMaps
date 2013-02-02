/*global nokia: false*/

// TODO: check out http://jhere.net/

function HereMapControl() {
  var me = this;

  this.hereMap = null;
  this.previousPolyLine = null;
  this.previousMileMarkerCollection = null;

  this.initialize = function (latitude, longitude, zoomLevel, onViewChanged) {
    nokia.Settings.set("appId", "63ii-nsJjiF97C-K3jqU");
    nokia.Settings.set("authenticationToken", "FTtFzF5jfEr7iRYgv6tEgg");

    me.hereMap = new nokia.maps.map.Display(document.getElementById("here-maps"), {
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

    me.hereMap.addListener("mapviewchangeend", onViewChanged, true);
  };

  this.displayTrack = function(trail) {
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
    me.hereMap.objects.add(polyLine);
    if (me.previousPolyLine) {
      me.hereMap.objects.remove(me.previousPolyLine);
    }
    me.previousPolyLine = polyLine;
  };

  this.displayMileMarkers = function (trail) {
  };

  this.getCenter = function() {
    var center = me.hereMap.center;
    return new Location(center.latitude, center.longitude);
  };

  this.getBounds = function() {
    var bounds = me.hereMap.getViewBounds();
    var center = bounds.getCenter();
    return new Rectangle(new Location(center.latitude, center.longitude), bounds.getWidth(), bounds.getHeight());
  };

  this.getZoom = function() {
    return me.hereMap.zoomLevel;
  };

  this.getCenterAndZoom = function() {
    var center = me.hereMap.center;
    return {
      center: {
        latitude: center.latitude,
        longitude: center.longitude
      },
      zoom: me.hereMap.zoomLevel
    };
  };

  this.setCenterAndZoom = function(options) {
    var mapCenter = new nokia.maps.geo.Coordinate(options.center.latitude, options.center.longitude);
    me.hereMap.setCenter(mapCenter);
    me.hereMap.setZoomLevel(options.zoom);
  };
}

