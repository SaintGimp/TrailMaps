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
    

    this.initialize = function () {
        // http://msdn.microsoft.com/en-us/library/gg427609.aspx
        Microsoft.Maps.loadModule('Microsoft.Maps.Themes.BingTheme', { callback: function() {
            me.bingMap = new Microsoft.Maps.Map(document.getElementById("map_canvas"), {
                credentials: "AiiVGjRyDyDynh0IbGjn7u4ee-6U9F-ZyjnRj5wYEFp_J6kq5HGcMfdd-TYE_6xF",
                center: new Microsoft.Maps.Location(me.defaultLatitude, me.defaultLongitude),
                mapTypeId: Microsoft.Maps.MapTypeId.aerial,
                zoom: me.defaultZoomLevel,
                enableClickableLogo: false,
                enableSearchLogo: false,
                inertiaIntensity: 0.5,
                tileBuffer: 1,
                showBreadcrumb: false,
                theme: new Microsoft.Maps.Themes.BingTheme()
            });

            Microsoft.Maps.Events.addHandler(me.bingMap, 'viewchange', me.onViewChange);
            Microsoft.Maps.Events.addHandler(me.bingMap, 'viewchangeend', me.onViewChangeEnd);
        }});
    };

    this.calculateScrollBounds = function () {
        // The map bounds adjusts the center if height gets too big so we get the map center directly
        var mapCenter = me.bingMap.getCenter();
        var mapBounds = me.bingMap.getBounds();
        var scrollBoundsSize = mapBounds.width * me.scrollBoundsMultiple;
        // We get weird behavior when west goes past -180 and wraps around to +180. We should
        // probably build a custom rect in that case that's constrained to west < east, but this
        // will do for now.
        scrollBoundsSize = Math.min(scrollBoundsSize, 60);
        me.scrollBounds = new Microsoft.Maps.LocationRect(mapCenter, scrollBoundsSize, scrollBoundsSize);
    };

    this.calculateTrackBounds = function () {
        var mapCenter = me.bingMap.getCenter();
        var mapBounds = me.bingMap.getBounds();
        var trackBoundsSize = mapBounds.width * me.trackBoundsMultiple;
        trackBoundsSize = Math.min(trackBoundsSize, 60);
        return new Microsoft.Maps.LocationRect(mapCenter, trackBoundsSize, trackBoundsSize);
    };

    this.loadTrack = function(data) {
        var vertices = [];
        $.each(data.track, function (i, point) {
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

    this.loadWaypoints = function (data) {
        var newWaypointCollection = new Microsoft.Maps.EntityCollection({ visible: true });
        $.each(data.waypoints, function (i, waypoint) {
            var location = new Microsoft.Maps.Location(waypoint.loc[1], waypoint.loc[0]);
            var options = {
                icon: '/images/mile_marker.png',
                htmlContent: '<div><img src="/images/mile_marker.png"><span class="waypoint_text">' + waypoint.distance + '</span></div>',
                //text: waypoint.distance.toString(),
                typeName: 'labelPin',
                height: 25,
                width: 75,
                anchor: new Microsoft.Maps.Point(12, 12),
                //textOffset: new Microsoft.Maps.Point(24, 5)
            };
            newWaypointCollection.push(new Microsoft.Maps.Pushpin(location, options));
        });

        me.bingMap.entities.push(newWaypointCollection);
        if (me.previousWaypointCollection) {
            me.bingMap.entities.remove(me.previousWaypointCollection);
        }
        me.previousWaypointCollection = newWaypointCollection;
    };

    this.loadTrail = function () {
        me.calculateScrollBounds();
        var trackBounds = me.calculateTrackBounds();

        var trailUrl = 'api/trails/pct' + me.buildUrlParameters(trackBounds);

        $.getJSON(trailUrl, null, function (data) {
            me.loadTrack(data);
            me.loadWaypoints(data);
        });
    };

    this.buildUrlParameters = function (trackBounds) {
        var north = trackBounds.getNorth();
        var south = trackBounds.getSouth();
        var east = trackBounds.getEast();
        var west = trackBounds.getWest();
        
        var detail = me.bingMap.getZoom();
        
        return '?north=' + north + '&south=' + south + '&east=' + east + '&west=' + west + "&detail=" + detail;
    };

    this.onViewChange = function () {
        if (me.needToLoadNewData()) {
            me.loadTrail();
        }
    };

    this.onViewChangeEnd = function () {
        if (me.needToLoadNewData()) {
            me.loadTrail();
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