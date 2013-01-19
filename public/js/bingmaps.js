/*global Microsoft: false*/

function MapControl() {
    var me = this;

    // TODO: the visual display of the track starts to break up as we scroll the view, before
    // we load a new track. Seems to be a Bing problem.  Maybe we should load a smaller track bounds?
    
//    this.defaultLatitude = 32.5897070;
//    this.defaultLongitude = -116.4669600;
    this.defaultLatitude = 40.50642708521896;
    this.defaultLongitude = -121.36087699433327;
    this.defaultZoomLevel = 5;
    this.previousZoomLevel = this.defaultZoomLevel;
    this.scrollBoundsMultiple = 2;
    this.trackBoundsMultiple = 3;
    this.bingMap = null;
    this.previousPolyLine = null;
    this.scrollBounds = null;
    this.previousWaypointCollection = null;
    this.waypointZoomLimit = 1;
    

    this.initialize = function () {
        // http://msdn.microsoft.com/en-us/library/gg427609.aspx
        me.bingMap = new Microsoft.Maps.Map(document.getElementById("map_canvas"), {
            credentials: "AiiVGjRyDyDynh0IbGjn7u4ee-6U9F-ZyjnRj5wYEFp_J6kq5HGcMfdd-TYE_6xF",
            center: new Microsoft.Maps.Location(me.defaultLatitude, me.defaultLongitude),
            mapTypeId: Microsoft.Maps.MapTypeId.aerial,
            zoom: me.defaultZoomLevel,
            enableClickableLogo: false,
            enableSearchLogo: false,
            inertiaIntensity: 0.5,
            tileBuffer: 2
        });

        Microsoft.Maps.Events.addHandler(me.bingMap, 'viewchange', me.onViewChange);
        Microsoft.Maps.Events.addHandler(me.bingMap, 'viewchangeend', me.onViewChangeEnd);
    };

    this.loadData = function () {
        me.calculateScrollBounds();
        var trackBounds = me.calculateTrackBounds();

        me.loadTrack(trackBounds);
        me.loadWaypoints(trackBounds);
    };

    this.calculateScrollBounds = function () {
        var mapBounds = me.bingMap.getBounds();
        var scrollBoundsSize = mapBounds.width * me.scrollBoundsMultiple;
        me.scrollBounds = new Microsoft.Maps.LocationRect(mapBounds.center, scrollBoundsSize, scrollBoundsSize);
    };

    this.calculateTrackBounds = function () {
        var mapBounds = me.bingMap.getBounds();
        var trackBoundsSize = mapBounds.width * me.trackBoundsMultiple;
        return new Microsoft.Maps.LocationRect(mapBounds.center, trackBoundsSize, trackBoundsSize);
    };

    this.loadTrack = function (trackBounds) {
        var trackUrl = 'api/trails/pct' + me.buildUrlParameters(trackBounds);

        $.getJSON(trackUrl, null, function (data) {
            var vertices = [];
            $.each(data.points, function (i, point) {
                vertices.push(new Microsoft.Maps.Location(point.lat, point.lon));
            });

            var polyLine = new Microsoft.Maps.Polyline(vertices, null);

            // First add new track, then remove old track
            me.bingMap.entities.push(polyLine);
            if (me.previousPolyLine) {
                me.bingMap.entities.remove(me.previousPolyLine);
            }
            me.previousPolyLine = polyLine;
        });
    };

    this.loadWaypoints = function (trackBounds) {
        var newWaypointCollection = null;
        if (me.bingMap.getZoom() >= me.waypointZoomLimit) {
            var waypointsUrl = 'home/GetWaypointList' + me.buildUrlParameters(trackBounds);
            newWaypointCollection = new Microsoft.Maps.EntityCollection({ visible: true });

            $.getJSON(waypointsUrl, null, function (data) {
                $.each(data.Waypoints, function (i, waypoint) {
                    var location = new Microsoft.Maps.Location(waypoint.Latitude, waypoint.Longitude);
                    newWaypointCollection.push(new Microsoft.Maps.Pushpin(location, { icon: 'Content/mile_marker.png', text: waypoint.Text, typeName: 'labelPin', height: 25, width: 25, anchor: new Microsoft.Maps.Point(12, 12), textOffset: new Microsoft.Maps.Point(24, 5) }));
                });
            });

            me.bingMap.entities.push(newWaypointCollection);
        }
        if (me.previousWaypointCollection) {
            me.bingMap.entities.remove(me.previousWaypointCollection);
        }
        me.previousWaypointCollection = newWaypointCollection;
    };

    this.buildUrlParameters = function (trackBounds) {
        var north = trackBounds.getNorth();
        var south = trackBounds.getSouth();

        // HACK: the bounds could expand past the -180/+180 line and wrap around. We
        // don't handle that well on the server right now so fix it here.
        var east = trackBounds.getEast();
        if (east < -120) {
            east = -110;
        }
        var west = trackBounds.getWest();
        if (west > -110) {
            west = -180;
        }
        
        var zoom = me.bingMap.getZoom();
        
        return '?north=' + north + '&south=' + south + '&east=' + east + '&west=' + west + "&zoom=" + zoom;
    };

    this.onViewChange = function () {
        if (me.needToLoadNewData()) {
            me.loadData();
        }
    };

    this.onViewChangeEnd = function () {
        if (me.needToLoadNewData()) {
            me.loadData();
        }
    };

    this.needToLoadNewData = function () {
        if (me.scrollBounds === null) {
            return true;
        }

        if (me.bingMap.getZoom() !== me.bingMap.getTargetZoom()) {
            // Don't load new tracks while in the process of zooming
            return false;
        }
        
        if (me.bingMap.getZoom() !== me.previousZoomLevel) {
            me.previousZoomLevel = me.bingMap.getZoom();
            return true;
        }

        return !me.scrollBounds.contains(me.bingMap.getBounds().center);
    };
}

var mapControl = new MapControl();

$(function () {
    mapControl.initialize();
});