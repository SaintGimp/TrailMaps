/*global google: false*/
/*global markerWithLabel: false*/

import { Location, Rectangle } from "./trailmaps.js";

let googleMap;
let previousPolyLine;
const markerElementCollection = [];
let apiKey;
let bootstrapInitialized = false;

async function fetchApiKey() {
  if (!apiKey) {
    const response = await fetch("/api/config");
    const config = await response.json();
    apiKey = config.googleMapsApiKey;
  }
  return apiKey;
}

async function ensureBootstrapLoaded() {
  if (bootstrapInitialized) {
    return;
  }

  await fetchApiKey();

  // Google bootstrap loader from https://developers.google.com/maps/documentation/javascript/load-maps-js-api
  // prettier-ignore
  // eslint-disable-next-line no-async-promise-executor, no-undef
  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: apiKey,
    v: "weekly",
    // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
    // Add other bootstrap parameters as needed, using camel case.
  });

  bootstrapInitialized = true;
}

async function initialize(container, center, zoomLevel, onViewChanged) {
  await ensureBootstrapLoaded();
  await google.maps.importLibrary("maps");

  return new Promise((resolve) => {
    // https://developers.google.com/maps/documentation/javascript/
    const mapOptions = {
      center: new google.maps.LatLng(center.latitude, center.longitude),
      // Google maps zoom levels are off by one compared to other map providers
      zoom: zoomLevel + 1,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      cameraControl: true,
      streetViewControl: false
    };
    googleMap = new google.maps.Map(container, mapOptions);

    // We listen for the first bounds_changed event to know when the map is ready,
    // then register the onViewChanged listener for future idle events.
    google.maps.event.addListenerOnce(googleMap, "bounds_changed", function () {
      google.maps.event.addListener(googleMap, "idle", onViewChanged);
      resolve();
    });
  });
}

function displayTrack(track) {
  const vertices = [];
  track.forEach(function (point) {
    vertices.push(new google.maps.LatLng(point.loc[1], point.loc[0]));
  });

  const polyLine = new google.maps.Polyline({
    path: vertices,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 3
  });

  // First add new track, then remove old track
  polyLine.setMap(googleMap);
  if (previousPolyLine) {
    previousPolyLine.setMap(null);
  }
  previousPolyLine = polyLine;
}

function displayMileMarkers(mileMarkers) {
  // Remove existing mile markers
  markerElementCollection.forEach(function (marker) {
    marker.setMap(null);
  });
  markerElementCollection.length = 0;

  // TODO: I'd like to use an SVG marker but Google maps doesn't make that
  // easy to implement right now.
  var icon = {
    url: "/images/mile_marker.png",
    anchor: new google.maps.Point(12, 12)
  };

  mileMarkers.forEach(function (mileMarker) {
    var location = new google.maps.LatLng(mileMarker.loc[1], mileMarker.loc[0]);
    var options = {
      position: location,
      draggable: false,
      raiseOnDrag: false,
      map: googleMap,
      labelContent: mileMarker.mile.toString(),
      labelAnchor: new google.maps.Point(-13, 10),
      labelClass: "milemarker_text",
      icon: icon
    };
    var newMileMarkerElement = new markerWithLabel.MarkerWithLabel(options);
    markerElementCollection.push(newMileMarkerElement);
  });
}

function getCenter() {
  const center = googleMap.getCenter();
  return new Location(center.lat(), center.lng());
}

function getBounds() {
  const bounds = googleMap.getBounds();
  const center = bounds.getCenter();
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return new Rectangle(new Location(center.lat(), center.lng()), ne.lng() - sw.lng(), ne.lat() - sw.lat());
}

function getZoom() {
  // Google maps zoom levels are off by one compared to other map providers
  return googleMap.getZoom() - 1;
}

function getCenterAndZoom() {
  const mapCenter = googleMap.getCenter();
  return {
    center: {
      latitude: mapCenter.lat(),
      longitude: mapCenter.lng()
    },
    // Google maps zoom levels are off by one compared to other map providers
    zoom: googleMap.getZoom() - 1
  };
}

function setCenterAndZoom(options) {
  const mapCenter = new google.maps.LatLng(options.center.latitude, options.center.longitude);
  googleMap.setCenter(mapCenter);
  // Google maps zoom levels are off by one compared to other map providers
  googleMap.setZoom(options.zoom + 1);
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
