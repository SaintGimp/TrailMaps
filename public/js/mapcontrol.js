function Location(latitude, longitude) {
  this.latitude = latitude;
  this.longitude = longitude;
}

function Rectangle(center, width, height)
{
  this.center = center;
  this.width = width;
  this.height = height;
  this.north = center.latitude + (height / 2);
  this.south = center.latitude - (height / 2);
  this.east = center.longitude + (width / 2);
  this.west = center.longitude - (width / 2);

  this.contains = function(location) {
    return (location.latitude < this.north &&
      location.latitude > this.south &&
      location.longitude < this.east &&
      location.longitude > this.west);
  };
}

var mapControl = (function() {
  var activeMap;
  var defaultLatitude = 40.50642708521896;
  var defaultLongitude = -121.36087699433327;
  var defaultZoomLevel = 5;
  var previousZoomLevel = defaultZoomLevel;
  var scrollBoundsMultiple = 2;
  var trackBoundsMultiple = 3;
  var scrollBounds = null;
  var currentTrailData = null;

  function Map(initializer) {
    this.control = undefined;
    this.initializer = initializer;
    this.getControl = function() {
      if (!this.control) {
        this.control = this.initializer();
      }

      return this.control;
    };
  }

  var maps = {
    "#bing-maps": new Map(function() {
        var map = new BingMapControl();
        map.initialize(defaultLatitude, defaultLongitude, defaultZoomLevel, onViewChanged);
        return map;
    }),
    "#google-maps": new Map(function() {
        var map = new GoogleMapControl();
        map.initialize(defaultLatitude, defaultLongitude, defaultZoomLevel, onViewChanged);
        return map;
    })
  };

  function initialize(){
    activeMap = maps["#bing-maps"].getControl();
  }

  function setCenterAndZoom(center, zoomLevel) {
    activeMap.setCenterAndZoom(center, zoomLevel);
  }
  
  function showingMap(mapHash) {
    var centerAndZoom = activeMap.getCenterAndZoom();
    activeMap = maps[mapHash].getControl();
    activeMap.setCenterAndZoom(centerAndZoom);
    displayTrail(currentTrailData);
  }

  function calculateScrollBounds() {
    // The map bounds adjusts the center if height gets too big so we get the map center directly
    var mapCenter = activeMap.getCenter();
    var mapBounds = activeMap.getBounds();
    var scrollBoundsSize = mapBounds.width * scrollBoundsMultiple;
    // We get weird behavior when west goes past -180 and wraps around to +180. We should
    // probably build a custom rect in that case that's constrained to west < east, but this
    // will do for now.  The Bing.Location class has a NormalizeLongitude thing that might be of some help.
    scrollBoundsSize = Math.min(scrollBoundsSize, 60);
    scrollBounds = new Rectangle(mapCenter, scrollBoundsSize, scrollBoundsSize);
  }

  function calculateTrackBounds() {
    var mapCenter = activeMap.getCenter();
    var mapBounds = activeMap.getBounds();
    var trackBoundsSize = mapBounds.width * trackBoundsMultiple;
    trackBoundsSize = Math.min(trackBoundsSize, 60);
    return new Rectangle(mapCenter, trackBoundsSize, trackBoundsSize);
  }

  function displayTrail(trail) {
    activeMap.displayTrack(trail);
    activeMap.displayMileMarkers(trail);
  }

  function loadTrail() {
    calculateScrollBounds();
    var trackBounds = calculateTrackBounds();

    var trailUrl = 'api/trails/pct' + buildUrlParameters(trackBounds);

    console.log("Loading " + trailUrl);

    $.getJSON(trailUrl, null, function (data) {
      displayTrail(data);
      currentTrailData = data;
    });
  }

  function buildUrlParameters(trackBounds) {
    var north = trackBounds.north;
    var south = trackBounds.south;
    var east = trackBounds.east;
    var west = trackBounds.west;

    var detail = activeMap.getZoom();

    return '?north=' + north + '&south=' + south + '&east=' + east + '&west=' + west + "&detail=" + detail;
  }

  function onViewChanged() {
    if (needToLoadNewData()) {
      loadTrail();
    }
  }

  function needToLoadNewData() {
    if (scrollBounds === null) {
      return true;
    }

    if (activeMap.getZoom() !== previousZoomLevel) {
      previousZoomLevel = activeMap.getZoom();
      return true;
    }

    return !scrollBounds.contains(activeMap.getCenter());
  }

  return {
    initialize: initialize,
    setCenterAndZoom: setCenterAndZoom,
    showingMap: showingMap
  };
})();