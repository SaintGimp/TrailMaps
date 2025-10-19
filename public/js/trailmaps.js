/*global trailMaps: false*/

function Location(latitude, longitude) {
  this.latitude = latitude;
  this.longitude = longitude;
}

function Rectangle(center, width, height) {
  this.center = center;
  this.width = width;
  this.height = height;
  this.north = center.latitude + height / 2;
  this.south = center.latitude - height / 2;
  this.east = center.longitude + width / 2;
  this.west = center.longitude - width / 2;

  this.contains = function (location) {
    return (
      location.latitude < this.north &&
      location.latitude > this.south &&
      location.longitude < this.east &&
      location.longitude > this.west
    );
  };
}

// TODO: this is a little strange. We have a global trailmaps variable
// that holds default values from the server, and it has to be created
// before the module loading stuff kicks in.  However, this thing we're
// building here is what should be thought of as our namespace object
// so we merge in the config from the global.  Is there a better way?
const configuration = trailMaps.configuration;

export { Location, Rectangle, configuration };
