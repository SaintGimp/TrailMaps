var mapControl = (function() {
  var activeMap;

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
        map.initialize();
        return map;
    }),
    "#google-maps": new Map(function() {
        var map = new GoogleMapControl();
        map.initialize();
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
  }

  return {
    initialize: initialize,
    setCenterAndZoom: setCenterAndZoom,
    showingMap: showingMap
  };
})();