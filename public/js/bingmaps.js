/*global Microsoft: false*/

function BingMapControl() {
    var me = this;

    // TODO: the visual display of the track starts to break up as we scroll the view, before
    // we load a new track. Seems to be a Bing problem.  Maybe we should load a smaller track bounds?
    
    this.bingMap = null;
    this.previousPolyLine = null;
    this.previousWaypointCollection = null;
    

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


    this.displayTrack = function(data) {
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

    this.displayWaypoints = function (data) {
        var newWaypointCollection = new Microsoft.Maps.EntityCollection({ visible: true });
        $.each(data.waypoints, function (i, waypoint) {
            var location = new Microsoft.Maps.Location(waypoint.loc[1], waypoint.loc[0]);
            var options = {
                icon: '/images/mile_marker.png',
                htmlContent: '<div><img src="/images/mile_marker.png"><span class="waypoint_text">' + waypoint.mile + '</span></div>',
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

