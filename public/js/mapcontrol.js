var mapControl = (function() {
  var activeMap;

  function initialize(){
    activeMap = new BingMapControl();
    activeMap.initialize();
  }

  function setCenterAndZoom(center, zoomLevel) {
    activeMap.setCenterAndZoom(center, zoomLevel);
  }
  
  return {
    initialize: initialize,
    setCenterAndZoom: setCenterAndZoom,

  };
})();