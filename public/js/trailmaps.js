/*global define: false*/

define(function() {
  function Location(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  function Rectangle(center, width, height) {
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

  return {
    Location: Location,
    Rectangle: Rectangle
  };
});
