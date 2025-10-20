import { Location, Rectangle } from "./trailmaps.js";

let azureMap;
let trackDataSource;
let mileMarkerDataSource;
let subscriptionKey = null;

const mileMarkerSvgIcon =
  `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'>
     <polygon points='2,7 7,2 12,7 7,12' style='fill:red;stroke:blue;stroke-width:4' />
   </svg>`;

async function fetchSubscriptionKey() {
  if (!subscriptionKey) {
    const response = await fetch("/api/config");
    const config = await response.json();
    subscriptionKey = config.azureMapsSubscriptionKey;
  }
  return subscriptionKey;
}

async function initialize(container, center, zoomLevel, onViewChanged) {
  const key = await fetchSubscriptionKey();
  
  return new Promise((resolve) => {
    azureMap = new atlas.Map(container, {
      center: new atlas.data.Position(center.longitude, center.latitude),
      zoom: zoomLevel,
      maxZoom: 20,
      wheelZoomRate: 1,
      renderWorldCopies: false,
      showLogo: false,
      style: "satellite_road_labels",
      view: "Auto",

      authOptions: {
        authType: "subscriptionKey",
        subscriptionKey: key
      }
    });

    azureMap.controls.add(new atlas.control.StyleControl({
      mapStyles: ['road', 'road_shaded_relief', 'satellite', 'satellite_road_labels'],
      layout: 'list'
    }), {
      position: 'top-right'
    });
    
    azureMap.controls.add(new atlas.control.ScaleControl(), {
      position: 'bottom-right'
    });

    azureMap.controls.add(new atlas.control.ZoomControl(), {
        position: 'top-left'
    });

    azureMap.events.add('ready', () => {
      trackDataSource = new atlas.source.DataSource();
      azureMap.sources.add(trackDataSource);
      azureMap.layers.add(new atlas.layer.LineLayer(trackDataSource, null, {
          strokeColor: 'red',
          strokeWidth: 3
      }));

      azureMap.imageSprite.add('mileMarker', mileMarkerSvgIcon).then(function () {
        mileMarkerDataSource = new atlas.source.DataSource();
        azureMap.sources.add(mileMarkerDataSource);
        azureMap.layers.add(new atlas.layer.SymbolLayer(mileMarkerDataSource, null, {
            iconOptions: {
              image: 'mileMarker',
              anchor: 'center'
            },
            textOptions: {
              textField: ['to-string', ['get', 'name']],
              anchor: 'top',
              offset: [0, 0.8],
              color: 'white',
              haloColor: 'black',
              haloWidth: 1
            }
        }));

        resolve();
      });

      azureMap.events.add("dragend", onViewChanged);
      azureMap.events.add("zoomend", onViewChanged);
      azureMap.events.add("resize", onViewChanged);
    });
  });
}

function displayTrack(track) {
  const vertices = [];
  track.forEach(function (point) {
    vertices.push(new atlas.data.Position(point.loc[0], point.loc[1]));
  });

  const polyLine = new atlas.data.LineString(vertices);
  trackDataSource.setShapes(polyLine);
}

function displayMileMarkers(mileMarkers) {
  const features = new atlas.data.FeatureCollection(mileMarkers.map(function (mileMarker) {
    return new atlas.data.Feature(new atlas.data.Point([mileMarker.loc[0], mileMarker.loc[1]]), {
      name: mileMarker.mile.toString()
    });
  }));
  mileMarkerDataSource.setShapes(features);
}

function getCenter() {
  const center = azureMap.getCamera().center;
  return new Location(center[1], center[0]);
}

function getBounds() {
  const bounds = azureMap.getCamera().bounds;
  return new Rectangle(new Location(atlas.data.BoundingBox.getCenter(bounds)[1],
    atlas.data.BoundingBox.getCenter(bounds)[0]),
    atlas.data.BoundingBox.getWidth(bounds),
    atlas.data.BoundingBox.getHeight(bounds));
}

function getZoom() {
  return azureMap.getCamera().zoom;
}

function getCenterAndZoom() {
  return {
    center: getCenter(),
    zoom: getZoom()
  };
}

function setCenterAndZoom(options) {
  const viewOptions = azureMap.getOptions();
  viewOptions.center = new Microsoft.Maps.Location(options.center.latitude, options.center.longitude);
  viewOptions.zoom = options.zoom;
  azureMap.setView(viewOptions);
}

export default {
  initialize,
  displayTrack,
  displayMileMarkers,
  getCenter,
  getBounds,
  getZoom,
  getCenterAndZoom,
  setCenterAndZoom
};
